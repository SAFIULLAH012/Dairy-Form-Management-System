/**
 * Platform Adapter Interfaces for Dairy Farm ERP
 * Strictly platform-agnostic contracts for Web and Android implementations.
 * No domain service or presentation logic directly depends on platform APIs.
 */

export interface IDatabaseAdapter {
  init(): Promise<void>;
  run(sql: string, params?: any[]): void;
  all<T = any>(sql: string, params?: any[]): T[];
  get<T = any>(sql: string, params?: any[]): T | null;
  exec(sql: string): void;
  save(): void;
  transaction<T>(fn: () => T): T;
  exportDatabase(): Uint8Array;
  importDatabase(data: Uint8Array): void;
}

export interface INotificationAdapter {
  schedule(params: {
    id: number;
    title: string;
    body: string;
    triggerDate: Date;
    extra?: Record<string, any>;
  }): Promise<void>;
  cancel(id: number): Promise<void>;
  checkPermissions(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface IFileStorageAdapter {
  saveFile(filename: string, data: Uint8Array | string, mimeType?: string): Promise<string>;
  readFile(path: string): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<void>;
  validateFile(file: { name: string; size: number; type: string }): FileValidationResult;
  sanitizeFilename(name: string): string;
}

export interface ICameraAdapter {
  capturePhoto(): Promise<string | null>;
  pickFromGallery(): Promise<string | null>;
}

export interface IBackupAdapter {
  exportBackup(content: string, filename: string): Promise<void>;
  importBackup(): Promise<string | null>;
}

export interface IShareAdapter {
  shareText(title: string, text: string): Promise<void>;
  shareFile(title: string, filePath: string, mimeType: string): Promise<void>;
}

export interface PlatformAdapters {
  db: IDatabaseAdapter;
  notifications: INotificationAdapter;
  storage: IFileStorageAdapter;
  camera: ICameraAdapter;
  backup: IBackupAdapter;
  share: IShareAdapter;
  isNative: boolean;
  platform: 'web' | 'android' | 'ios';
}
