import fs from 'fs';
import path from 'path';
import { logger } from './logger.ts';

export class BackupManager {
  private backupDir: string;
  private dbPath: string;
  private maxBackups: number;

  constructor(customDbPath?: string, maxBackups = 7) {
    this.dbPath = customDbPath || path.resolve(process.cwd(), 'dairy_farm.sqlite');
    this.backupDir = path.resolve(process.cwd(), 'backups');
    this.maxBackups = maxBackups;

    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch (err) {
        logger.error('Failed to create backups directory', err);
      }
    }
  }

  /**
   * Creates a timestamped snapshot of the live SQLite database file.
   */
  createSnapshot(reason = 'auto'): string | null {
    if (!fs.existsSync(this.dbPath)) {
      logger.warn(`Cannot snapshot non-existent database at: ${this.dbPath}`);
      return null;
    }

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
      const filename = `dairy_farm_${reason}_${dateStr}_${timeStr}.sqlite`;
      const targetPath = path.join(this.backupDir, filename);

      fs.copyFileSync(this.dbPath, targetPath);
      logger.info(`Automated backup snapshot created: ${filename}`);

      this.rotateBackups();
      return targetPath;
    } catch (err) {
      logger.error('Failed to create database snapshot', err);
      return null;
    }
  }

  /**
   * Retains only the most recent N backups (default: 7) to prevent disk bloat.
   */
  private rotateBackups(): void {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('dairy_farm_') && f.endsWith('.sqlite'))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          const stats = fs.statSync(filePath);
          return { name: f, path: filePath, time: stats.mtime.getTime() };
        })
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups);
        for (const file of toDelete) {
          fs.unlinkSync(file.path);
          logger.info(`Pruned old backup snapshot: ${file.name}`);
        }
      }
    } catch (err) {
      logger.warn('Failed during backup rotation', err);
    }
  }

  listBackups(): Array<{ name: string; sizeBytes: number; createdAt: string }> {
    try {
      if (!fs.existsSync(this.backupDir)) return [];
      return fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.sqlite'))
        .map(f => {
          const fullPath = path.join(this.backupDir, f);
          const stats = fs.statSync(fullPath);
          return {
            name: f,
            sizeBytes: stats.size,
            createdAt: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    } catch (err) {
      logger.error('Error listing backups', err);
      return [];
    }
  }
}
