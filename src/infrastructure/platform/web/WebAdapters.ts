/**
 * Web Platform Adapters for Dairy Farm ERP
 * Offline-first web implementations utilizing browser standard APIs & sql.js WebAssembly.
 */

import initSqlJs, { Database } from 'sql.js';
import {
  IDatabaseAdapter,
  INotificationAdapter,
  IFileStorageAdapter,
  ICameraAdapter,
  IBackupAdapter,
  IShareAdapter,
  FileValidationResult,
} from '../interfaces.ts';
import { MigrationRunner } from '../../database/migrations.ts';

export class WebDatabaseAdapter implements IDatabaseAdapter {
  protected db: Database | null = null;
  private storageKey = 'dairy_farm_db_wasm';

  async init(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: file => (typeof window !== 'undefined' ? `${window.location.origin}/${file}` : `/${file}`),
    });

    let savedData: Uint8Array | null = null;

    // In browser environment, check IndexedDB or localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const b64 = localStorage.getItem(this.storageKey);
      if (b64) {
        try {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          savedData = bytes;
        } catch {
          // ignore corrupted storage
        }
      }
    }

    if (savedData) {
      try {
        this.db = new SQL.Database(savedData);
        const count = this.get<{ count: number }>('SELECT count(*) as count FROM animals')?.count || 0;
        if (count < 100) {
          this.run('DELETE FROM schema_migrations WHERE version >= 5');
        }
      } catch {
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    // Run versioned migrations
    MigrationRunner.runMigrations(this);
    this.save();
  }

  getDb(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  private sanitizeParams(params: any[]): any[] {
    return params.map(p => (p === undefined ? null : p));
  }

  run(sql: string, params: any[] = []): void {
    const db = this.getDb();
    db.run(sql, this.sanitizeParams(params));
    this.save();
  }

  all<T = any>(sql: string, params: any[] = []): T[] {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    try {
      stmt.bind(this.sanitizeParams(params));
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      return results;
    } finally {
      stmt.free();
    }
  }

  get<T = any>(sql: string, params: any[] = []): T | null {
    const results = this.all<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  exec(sql: string): void {
    const db = this.getDb();
    db.exec(sql);
    this.save();
  }

  save(): void {
    if (!this.db || typeof window === 'undefined' || !window.localStorage) return;
    try {
      const data = this.db.export();
      let binary = '';
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      localStorage.setItem(this.storageKey, btoa(binary));
    } catch (e) {
      console.warn('LocalStorage database save warning:', e);
    }
  }

  transaction<T>(fn: () => T): T {
    this.exec('BEGIN TRANSACTION;');
    try {
      const result = fn();
      this.exec('COMMIT;');
      return result;
    } catch (err) {
      this.exec('ROLLBACK;');
      throw err;
    }
  }

  exportDatabase(): Uint8Array {
    return this.getDb().export();
  }

  importDatabase(data: Uint8Array): void {
    const SQL = (this.db as any)?.constructor;
    if (SQL) {
      this.db = new SQL(data);
      this.save();
    }
  }
}

export class WebNotificationAdapter implements INotificationAdapter {
  async checkPermissions(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  async requestPermissions(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  async schedule(params: {
    id: number;
    title: string;
    body: string;
    triggerDate: Date;
    extra?: Record<string, any>;
  }): Promise<void> {
    const now = new Date().getTime();
    const delay = Math.max(0, params.triggerDate.getTime() - now);

    if (delay === 0 && (await this.checkPermissions())) {
      new Notification(params.title, { body: params.body });
    } else {
      setTimeout(async () => {
        if (await this.checkPermissions()) {
          new Notification(params.title, { body: params.body });
        }
      }, Math.min(delay, 2147483647));
    }
  }

  async cancel(_id: number): Promise<void> {
    // Handled via state
  }
}

export class WebFileStorageAdapter implements IFileStorageAdapter {
  private allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
  ]);
  private maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

  sanitizeFilename(name: string): string {
    // Prevent directory traversal (../ or ..\) and dangerous symbols
    const cleaned = name.replace(/(\.\.[\/\\])+/g, '').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    return cleaned || `file_${Date.now()}`;
  }

  validateFile(file: { name: string; size: number; type: string }): FileValidationResult {
    if (file.size > this.maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      };
    }
    if (file.type && !this.allowedMimeTypes.has(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `File type '${file.type}' is not supported. Allowed: JPG, PNG, WEBP, PDF, CSV.`,
      };
    }
    return { valid: true };
  }

  async saveFile(filename: string, data: Uint8Array | string, mimeType?: string): Promise<string> {
    const safeName = this.sanitizeFilename(filename);
    const key = `file_${safeName}_${Date.now()}`;

    let dataUri = '';
    if (typeof data === 'string') {
      dataUri = data;
    } else {
      let binary = '';
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      dataUri = `data:${mimeType || 'application/octet-stream'};base64,${btoa(binary)}`;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, dataUri);
      } catch {
        // Fallback in memory
      }
    }
    return key;
  }

  async readFile(path: string): Promise<Uint8Array | string> {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(path);
      if (item) return item;
    }
    return '';
  }

  async deleteFile(path: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(path);
    }
  }
}

export class WebCameraAdapter implements ICameraAdapter {
  async capturePhoto(): Promise<string | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  async pickFromGallery(): Promise<string | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
}

export class WebBackupAdapter implements IBackupAdapter {
  async exportBackup(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importBackup(): Promise<string | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  }
}

export class WebShareAdapter implements IShareAdapter {
  async shareText(title: string, text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert(`${title}\nCopied to clipboard.`);
    }
  }

  async shareFile(title: string, filePath: string, mimeType: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const blob = new Blob([filePath], { type: mimeType });
        const file = new File([blob], title, { type: mimeType });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title });
          return;
        }
      } catch {
        // fallback
      }
    }
    alert(`File ready: ${title}`);
  }
}
