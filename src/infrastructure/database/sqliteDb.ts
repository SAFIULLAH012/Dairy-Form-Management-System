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
    const SQL = await initSqlJs();

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
    const countAnimals = this.get<{ count: number }>('SELECT count(*) as count FROM animals');

    if (countAnimals && countAnimals.count > 0) {
      return; // Already initialized
    }

    const now = new Date().toISOString();

    // Seed groups
    const groups = ['High', 'Low', 'Breeding Male', 'Calves', 'Fresh'];
    for (const g of groups) {
      db.run('INSERT OR IGNORE INTO groups_list (name) VALUES (?)', [g]);
    }

    // Seed shifts
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

    // Seed settings
    db.run(
      `INSERT OR IGNORE INTO farm_settings (
        id, farm_name, farm_address, phone, email, currency, date_format, time_format,
        weight_unit, milk_unit, feed_unit, timezone, default_payment_terms_days,
        default_milk_shifts, reminder_minutes, low_stock_horizon_days, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'DEFAULT_SETTINGS',
        'Sunrise Dairy Farm',
        'Rural Farm Sector 4',
        '+92 300 1234567',
        'info@sunrisedairy.local',
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

    // Seed sample customers from prototype
    db.run(
      `INSERT OR IGNORE INTO customers (id, name, company, phone, default_rate_per_l, payment_terms_days, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CUST_1', 'Nestlé', 'Nestlé Pakistan', '+92 42 111 637 853', 210, 7, 'Active', now]
    );
    db.run(
      `INSERT OR IGNORE INTO customers (id, name, company, phone, default_rate_per_l, payment_terms_days, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CUST_2', 'Local Dairy', 'Local Chilling Center', '+92 321 9876543', 200, 7, 'Active', now]
    );

    // Seed prototype animals
    const initialAnimals = [
      {
        id: 'C-001',
        cow_number: 'C-001',
        tag1: 'TAG-001',
        sex: 'Female',
        dob: '2022-01-12',
        breed: 'Friesian Cross',
        group_name: 'High',
        stage: 'Adult',
        repro_status: 'Pregnant',
        milk_status: 'Milking',
        status: 'Active',
        purchase_date: '2023-01-05',
        purchase_price: 280000,
        supplier: 'Farm A',
        notes: 'High yielding, stable fat content',
      },
      {
        id: 'C-002',
        cow_number: 'C-002',
        tag1: 'TAG-002',
        sex: 'Female',
        dob: '2021-08-03',
        breed: 'Jersey Cross',
        group_name: 'Low',
        stage: 'Adult',
        repro_status: 'Repeat',
        milk_status: 'Milking',
        status: 'Active',
        purchase_date: '2022-11-10',
        purchase_price: 250000,
        supplier: 'Farm B',
        notes: 'Regular check needed',
      },
      {
        id: 'H-011',
        cow_number: 'H-011',
        tag1: 'TAG-011',
        sex: 'Female',
        dob: '2024-06-18',
        breed: 'Cross',
        group_name: 'Low',
        stage: 'Heifer',
        repro_status: 'Nil',
        milk_status: 'Dry',
        status: 'Active',
        purchase_date: '2024-12-01',
        purchase_price: 180000,
        supplier: 'Farm C',
        notes: 'Target first breeding in 4 months',
      },
      {
        id: 'M-007',
        cow_number: 'M-007',
        tag1: 'BULL-007',
        sex: 'Male',
        dob: '2025-02-10',
        breed: 'Cross',
        group_name: 'Breeding Male',
        stage: 'Male',
        repro_status: 'N/A',
        milk_status: 'N/A',
        status: 'Active',
        purchase_date: '2025-03-01',
        purchase_price: 200000,
        supplier: 'Farm D',
        notes: 'Breeding sire pedigree',
      },
    ];

    for (const a of initialAnimals) {
      db.run(
        `INSERT INTO animals (
          id, cow_number, tag1, sex, dob, breed, group_name, stage, repro_status,
          milk_status, status, purchase_date, purchase_price, supplier, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.cow_number,
          a.tag1,
          a.sex,
          a.dob,
          a.breed,
          a.group_name,
          a.stage,
          a.repro_status,
          a.milk_status,
          a.status,
          a.purchase_date,
          a.purchase_price,
          a.supplier,
          a.notes,
          now,
          now,
        ]
      );

      db.run(
        'INSERT INTO animal_identifiers (id, animal_id, type, value) VALUES (?, ?, ?, ?)',
        [`ID_${a.id}`, a.id, 'COW_NUMBER', a.id]
      );
      if (a.tag1) {
        db.run(
          'INSERT INTO animal_identifiers (id, animal_id, type, value) VALUES (?, ?, ?, ?)',
          [`TAG_${a.id}`, a.id, 'TAG_1', a.tag1]
        );
      }
    }

    // Seed feed types
    const feeds = [
      { name: 'Silage', desc: 'Fermented maize silage', price: 18.5 },
      { name: 'Green Fodder', desc: 'Fresh Rhodes grass / alfalfa', price: 9.0 },
      { name: 'Wanda', desc: 'Commercial dairy ration 18% CP', price: 85.0 },
      { name: 'Cotton Seed Cake', desc: 'High protein concentrate', price: 95.0 },
    ];

    for (const f of feeds) {
      db.run(
        'INSERT OR IGNORE INTO feed_types (id, name, description, default_price_per_kg) VALUES (?, ?, ?, ?)',
        [`FEED_${f.name.replace(/\s+/g, '_')}`, f.name, f.desc, f.price]
      );

      // Seed initial inventory
      db.run(
        `INSERT OR IGNORE INTO inventory_items (
          id, name, category, current_stock, unit, min_stock_threshold, avg_daily_consumption, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `INV_${f.name.replace(/\s+/g, '_')}`,
          f.name,
          'FEED',
          800, // 800 kg stock
          'KG',
          200, // 200 kg threshold
          150, // 150 kg/day avg
          now,
        ]
      );
    }
  }
}
