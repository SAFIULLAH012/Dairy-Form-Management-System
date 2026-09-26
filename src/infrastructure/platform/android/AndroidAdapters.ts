/**
 * Android Platform Adapters for Dairy Farm ERP
 * Implements 100% offline native Android integrations via Capacitor.
 * Operates without internet connectivity, cloud servers, or Firebase.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import {
  IDatabaseAdapter,
  INotificationAdapter,
  IFileStorageAdapter,
  ICameraAdapter,
  IBackupAdapter,
  IShareAdapter,
  FileValidationResult,
} from '../interfaces.ts';
import { WebDatabaseAdapter } from '../web/WebAdapters.ts';
import initSqlJs from 'sql.js';
import { MigrationRunner } from '../../database/migrations.ts';

import { App } from '@capacitor/app';

export class AndroidDatabaseAdapter extends WebDatabaseAdapter implements IDatabaseAdapter {
  private dbPath = 'dairy_farm_erp.sqlite';
  private savePromise: Promise<void> = Promise.resolve();
  private pendingSave = false;

  async init(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: file => `/${file}`,
    });

    let savedData: Uint8Array | null = null;
    
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.readFile({
          path: this.dbPath,
          directory: Directory.Data,
        });
        
        const b64 = result.data as string;
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        savedData = bytes;
      } catch (e) {
        console.log('No existing database found on Android filesystem, starting fresh.');
      }
    }

    if (savedData) {
      this.db = new SQL.Database(savedData);
    } else {
      this.db = new SQL.Database();
    }

    MigrationRunner.runMigrations(this);
    this.save();

    // Hook into Android Lifecycle to ensure DB is saved safely if suspended or killed
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          console.log('App entering background. Flushing database...');
          this.save();
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.save());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.save();
      });
    }
  }

  save(): void {
    if (!this.db || !Capacitor.isNativePlatform()) return;
    
    // Prevent overlapping saves by queueing them
    if (this.pendingSave) return;
    this.pendingSave = true;

    try {
      const data = this.db.export();
      let binary = '';
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const b64 = btoa(binary);
      
      this.savePromise = this.savePromise.then(async () => {
        try {
          await Filesystem.writeFile({
            path: this.dbPath,
            data: b64,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
        } catch (e) {
          console.error('Failed to save DB to Android filesystem', e);
        } finally {
          this.pendingSave = false;
        }
      });
    } catch (e) {
      console.warn('Android filesystem database serialization warning:', e);
      this.pendingSave = false;
    }
  }
}

export class AndroidNotificationAdapter implements INotificationAdapter {
  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'granted';
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  }

  async schedule(params: {
    id: number;
    title: string;
    body: string;
    triggerDate: Date;
    extra?: Record<string, any>;
  }): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: params.id,
            title: params.title,
            body: params.body,
            schedule: { at: params.triggerDate },
            extra: params.extra,
            sound: undefined,
          },
        ],
      });
    }
  }

  async cancel(id: number): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    }
  }
}

export class AndroidFileStorageAdapter implements IFileStorageAdapter {
  private maxSizeBytes = 25 * 1024 * 1024; // 25MB for Android local files

  sanitizeFilename(name: string): string {
    return name.replace(/(\.\.[\/\\])+/g, '').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  }

  validateFile(file: { name: string; size: number; type: string }): FileValidationResult {
    if (file.size > this.maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds Android limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
      };
    }
    return { valid: true };
  }

  async saveFile(filename: string, data: Uint8Array | string): Promise<string> {
    const safeName = this.sanitizeFilename(filename);
    const path = `dairy_erp_${Date.now()}_${safeName}`;

    if (Capacitor.isNativePlatform()) {
      let contentString = '';
      if (typeof data === 'string') {
        contentString = data;
      } else {
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        contentString = btoa(binary);
      }

      await Filesystem.writeFile({
        path,
        data: contentString,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Data,
        path,
      });
      return uriResult.uri;
    }

    return path;
  }

  async readFile(path: string): Promise<Uint8Array | string> {
    if (Capacitor.isNativePlatform()) {
      const file = await Filesystem.readFile({
        path,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return file.data as string;
    }
    return '';
  }

  async deleteFile(path: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.deleteFile({
        path,
        directory: Directory.Data,
      });
    }
  }
}

export class AndroidCameraAdapter implements ICameraAdapter {
  async capturePhoto(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      return image.dataUrl || null;
    }
    return null;
  }

  async pickFromGallery(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      return image.dataUrl || null;
    }
    return null;
  }
}

export class AndroidBackupAdapter implements IBackupAdapter {
  async exportBackup(content: string, filename: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Documents,
        path: filename,
      });

      await Share.share({
        title: 'Dairy Farm Backup Export',
        text: `Dairy Farm ERP Backup (${filename})`,
        url: uriResult.uri,
        dialogTitle: 'Save / Share Backup JSON',
      });
    }
  }

  async importBackup(): Promise<string | null> {
    // In Android webview, the native file picker via input type=file handles JSON document selection
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

export class AndroidShareAdapter implements IShareAdapter {
  async shareText(title: string, text: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title,
        text,
        dialogTitle: title,
      });
    }
  }

  async shareFile(title: string, filePath: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title,
        url: filePath,
        dialogTitle: title,
      });
    }
  }
}
