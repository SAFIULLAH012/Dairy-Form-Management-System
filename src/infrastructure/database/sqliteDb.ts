import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { IDatabaseAdapter } from '../platform/interfaces.ts';
import { MigrationRunner } from './migrations.ts';

export class SQLiteDatabase implements IDatabaseAdapter {
  private db: Database | null = null;
  private dbPath: string;

  constructor(filePath?: string) {
    this.dbPath = filePath || path.resolve(process.cwd(), 'dairy_farm.sqlite');
  }

  async init(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: file => {
        if (typeof window !== 'undefined') {
          return `/${file}`;
        }
        return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
      }
    });

    if (fs.existsSync(this.dbPath)) {
      try {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(filebuffer);
      } catch (err) {
        console.warn('Could not read existing SQLite file, creating fresh database:', err);
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    this.db.run('PRAGMA foreign_keys = ON;');
    this.runMigrations();
    this.save();
  }

  getDb(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  save(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to save SQLite file to disk:', err);
    }
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

  transaction<T>(fn: () => T): T {
    this.exec('BEGIN TRANSACTION;');
    try {
      const res = fn();
      this.exec('COMMIT;');
      return res;
    } catch (e) {
      this.exec('ROLLBACK;');
      throw e;
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

  private runMigrations(): void {
    MigrationRunner.runMigrations(this);
    this.seedDefaultsIfEmpty();
  }

  private seedDefaultsIfEmpty(): void {
    const db = this.getDb();
    const countSettings = this.get<{ count: number }>('SELECT count(*) as count FROM farm_settings');

    if (countSettings && countSettings.count > 0) {
      return; // Already initialized with default settings
    }

    const now = new Date().toISOString();

    // Seed default groups (user can add/remove from Settings)
    const groups = ['High', 'Low', 'Breeding Male', 'Calves', 'Fresh'];
    for (const g of groups) {
      db.run('INSERT OR IGNORE INTO groups_list (name) VALUES (?)', [g]);
    }

    // Seed milk shifts (required for milk recording)
    db.run(
      'INSERT OR IGNORE INTO milk_shifts (id, name, start_time, end_time, active, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      ['SHIFT_MORN', 'Morning', '06:00', '08:30', 1, 30]
    );
    db.run(
      'INSERT OR IGNORE INTO milk_shifts (id, name, start_time, end_time, active, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      ['SHIFT_AFT', 'Afternoon', '13:00', '15:00', 1, 30]
    );
    db.run(
      'INSERT OR IGNORE INTO milk_shifts (id, name, start_time, end_time, active, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      ['SHIFT_EVE', 'Evening', '18:00', '20:30', 1, 30]
    );

    // Seed default farm settings (required for system to work)
    db.run(
      `INSERT OR IGNORE INTO farm_settings (
        id, farm_name, farm_address, phone, email, currency, date_format, time_format,
        weight_unit, milk_unit, feed_unit, timezone, default_payment_terms_days,
        default_milk_shifts, reminder_minutes, low_stock_horizon_days, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'DEFAULT_SETTINGS',
        'My Dairy Farm',
        '',
        '',
        '',
        'PKR',
        'YYYY-MM-DD',
        '24h',
        'KG',
        'Litres',
        'Maund',
        'UTC+5',
        7,
        JSON.stringify(['Morning', 'Afternoon', 'Evening']),
        30,
        4,
        now,
      ]
    );

    // No sample customers, feed types, inventory, or animals seeded.
    // User will add everything fresh from the UI.
  }
}
