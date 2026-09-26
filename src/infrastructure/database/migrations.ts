/**
 * Versioned Database Migrations Engine for Dairy Farm ERP
 * Executes migrations incrementally and records applied version in `schema_migrations`.
 * Never requires uninstall/reinstall to upgrade database schema.
 */

import { IDatabaseAdapter } from '../platform/interfaces.ts';

export interface Migration {
  version: number;
  name: string;
  up: (db: IDatabaseAdapter) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    up: (db: IDatabaseAdapter) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS animals (
          id TEXT PRIMARY KEY,
          cow_number TEXT,
          tag1 TEXT,
          tag2 TEXT,
          sex TEXT NOT NULL,
          dob TEXT NOT NULL,
          breed TEXT NOT NULL,
          group_name TEXT NOT NULL,
          stage TEXT NOT NULL,
          repro_status TEXT NOT NULL,
          milk_status TEXT NOT NULL,
          status TEXT NOT NULL,
          purchase_date TEXT,
          purchase_price REAL,
          supplier TEXT,
          notes TEXT,
          photo_url TEXT,
          dam_id TEXT,
          sire_id TEXT,
          birth_weight REAL,
          weaning_date TEXT,
          sale_date TEXT,
          sale_price REAL,
          buyer TEXT,
          death_date TEXT,
          death_reason TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS animal_identifiers (
          id TEXT PRIMARY KEY,
          animal_id TEXT NOT NULL,
          type TEXT NOT NULL,
          value TEXT NOT NULL UNIQUE,
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS status_history (
          id TEXT PRIMARY KEY,
          animal_id TEXT NOT NULL,
          change_type TEXT NOT NULL,
          old_value TEXT,
          new_value TEXT,
          date TEXT NOT NULL,
          reason TEXT,
          user_name TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS groups_list (
          name TEXT PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS milk_shifts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          reminder_minutes INTEGER NOT NULL DEFAULT 30
        );

        CREATE TABLE IF NOT EXISTS milk_total_entries (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          shift TEXT NOT NULL,
          total_litres REAL NOT NULL,
          fat_percent REAL,
          snf_percent REAL,
          mode TEXT NOT NULL,
          locked INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(date, shift)
        );

        CREATE TABLE IF NOT EXISTS milk_individual_entries (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          shift TEXT NOT NULL,
          animal_id TEXT NOT NULL,
          litres REAL NOT NULL,
          fat_percent REAL,
          snf_percent REAL,
          reason TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(date, shift, animal_id),
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS feed_types (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          default_price_per_kg REAL
        );

        CREATE TABLE IF NOT EXISTS feed_transactions (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          group_name TEXT NOT NULL,
          feed_type TEXT NOT NULL,
          maund REAL NOT NULL,
          kg REAL NOT NULL,
          price_per_kg REAL NOT NULL,
          total_cost REAL NOT NULL,
          supplier TEXT,
          notes TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          current_stock REAL NOT NULL,
          unit TEXT NOT NULL,
          min_stock_threshold REAL NOT NULL,
          avg_daily_consumption REAL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id TEXT PRIMARY KEY,
          item_id TEXT NOT NULL,
          item_name TEXT NOT NULL,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          quantity REAL NOT NULL,
          signed_quantity REAL NOT NULL,
          unit TEXT NOT NULL,
          unit_cost REAL NOT NULL,
          total_value REAL NOT NULL,
          reference TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (item_id) REFERENCES inventory_items(id)
        );

        CREATE TABLE IF NOT EXISTS health_cases (
          id TEXT PRIMARY KEY,
          animal_id TEXT NOT NULL,
          date TEXT NOT NULL,
          problem TEXT NOT NULL,
          symptoms TEXT,
          diagnosis TEXT,
          medicine TEXT,
          dose TEXT,
          injection TEXT,
          provider TEXT,
          cost REAL,
          status TEXT NOT NULL,
          follow_up_date TEXT,
          recovery_date TEXT,
          notes TEXT,
          source TEXT NOT NULL DEFAULT 'MANUAL',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS vaccination_records (
          id TEXT PRIMARY KEY,
          animal_id TEXT NOT NULL,
          vaccine_type TEXT NOT NULL,
          last_date TEXT NOT NULL,
          next_due_date TEXT NOT NULL,
          product TEXT,
          dose TEXT,
          provider TEXT,
          cost REAL,
          status TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS breeding_records (
          id TEXT PRIMARY KEY,
          animal_id TEXT NOT NULL,
          date TEXT NOT NULL,
          event TEXT NOT NULL,
          sire_breed_or_id TEXT,
          inseminator_name TEXT,
          expected_calving_date TEXT,
          recommended_dry_off_date TEXT,
          expected_next_heat_date TEXT,
          actual_calving_date TEXT,
          follow_up_date TEXT,
          status TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS growth_measurements (
          id TEXT PRIMARY KEY,
          animal_id TEXT NOT NULL,
          date TEXT NOT NULL,
          weight_kg REAL NOT NULL,
          age_days_at_weighing INTEGER NOT NULL,
          average_daily_gain REAL,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (animal_id) REFERENCES animals(id)
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          company TEXT,
          phone TEXT,
          address TEXT,
          default_rate_per_l REAL NOT NULL,
          payment_terms_days INTEGER NOT NULL,
          notes TEXT,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS delivery_invoices (
          id TEXT PRIMARY KEY,
          invoice_number TEXT NOT NULL UNIQUE,
          customer_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          receiver_name TEXT,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          litres REAL NOT NULL,
          fat_percent REAL,
          snf_percent REAL,
          rate_per_l REAL NOT NULL,
          total_amount REAL NOT NULL,
          payment_terms TEXT NOT NULL,
          due_date TEXT NOT NULL,
          paid_amount REAL NOT NULL,
          remaining_balance REAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          invoice_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          date TEXT NOT NULL,
          amount REAL NOT NULL,
          method TEXT NOT NULL,
          reference TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (invoice_id) REFERENCES delivery_invoices(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        );

        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL,
          joining_date TEXT NOT NULL,
          monthly_salary REAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS worker_transactions (
          id TEXT PRIMARY KEY,
          worker_id TEXT NOT NULL,
          worker_name TEXT NOT NULL,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (worker_id) REFERENCES workers(id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          vendor TEXT,
          payment_method TEXT NOT NULL,
          reference TEXT,
          notes TEXT,
          attachment_id TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farm_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          source_module TEXT NOT NULL,
          due_date TEXT NOT NULL,
          due_time TEXT NOT NULL,
          status TEXT NOT NULL,
          linked_record_id TEXT,
          auto_key TEXT,
          notes TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farm_settings (
          id TEXT PRIMARY KEY,
          farm_name TEXT NOT NULL,
          farm_address TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          logo_url TEXT,
          currency TEXT NOT NULL,
          date_format TEXT NOT NULL,
          time_format TEXT NOT NULL,
          weight_unit TEXT NOT NULL,
          milk_unit TEXT NOT NULL,
          feed_unit TEXT NOT NULL,
          timezone TEXT NOT NULL,
          default_payment_terms_days INTEGER NOT NULL,
          default_milk_shifts TEXT NOT NULL,
          reminder_minutes INTEGER NOT NULL,
          low_stock_horizon_days INTEGER NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          action TEXT NOT NULL,
          module TEXT NOT NULL,
          record_id TEXT NOT NULL,
          old_values TEXT,
          new_values TEXT,
          reason TEXT,
          user_name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attachment_metadata (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          local_path TEXT NOT NULL,
          checksum TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // Seed default settings so getSettings() never throws on a fresh Android install
      const seedNow = new Date().toISOString();
      db.run(
        `INSERT OR IGNORE INTO farm_settings (
          id, farm_name, farm_address, phone, email, currency, date_format, time_format,
          weight_unit, milk_unit, feed_unit, timezone, default_payment_terms_days,
          default_milk_shifts, reminder_minutes, low_stock_horizon_days, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'DEFAULT_SETTINGS', 'My Dairy Farm', '', '', '', 'PKR',
          'YYYY-MM-DD', '24h', 'KG', 'Litres', 'Maund', 'UTC+5',
          7, JSON.stringify(['Morning', 'Evening']), 30, 4, seedNow,
        ]
      );
      db.run(
        'INSERT OR IGNORE INTO milk_shifts (id, name, start_time, end_time, active, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
        ['SHIFT_MOR', 'Morning', '06:00', '08:00', 1, 30]
      );
      db.run(
        'INSERT OR IGNORE INTO milk_shifts (id, name, start_time, end_time, active, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
        ['SHIFT_EVE', 'Evening', '18:00', '20:30', 1, 30]
      );
    },
  },
  {
    version: 2,
    name: '002_performance_indexes',
    up: (db: IDatabaseAdapter) => {
      db.exec(`
        -- High performance indexes for 100+ cows & 10,000+ records
        CREATE INDEX IF NOT EXISTS idx_animal_id ON animals(id);
        CREATE INDEX IF NOT EXISTS idx_animal_cownum ON animals(cow_number);
        CREATE INDEX IF NOT EXISTS idx_animal_tag1 ON animals(tag1);
        CREATE INDEX IF NOT EXISTS idx_animal_tag2 ON animals(tag2);
        CREATE INDEX IF NOT EXISTS idx_animal_sex_status ON animals(sex, status);
        CREATE INDEX IF NOT EXISTS idx_animal_group ON animals(group_name);
        CREATE INDEX IF NOT EXISTS idx_animal_identifiers_val ON animal_identifiers(value);
        CREATE INDEX IF NOT EXISTS idx_status_hist_anim ON status_history(animal_id);
        CREATE INDEX IF NOT EXISTS idx_milk_tot_date ON milk_total_entries(date);
        CREATE INDEX IF NOT EXISTS idx_milk_tot_shift ON milk_total_entries(date, shift);
        CREATE INDEX IF NOT EXISTS idx_milk_ind_date_shift ON milk_individual_entries(date, shift);
        CREATE INDEX IF NOT EXISTS idx_milk_ind_animal ON milk_individual_entries(animal_id);
        CREATE INDEX IF NOT EXISTS idx_feed_date ON feed_transactions(date);
        CREATE INDEX IF NOT EXISTS idx_feed_group ON feed_transactions(group_name);
        CREATE INDEX IF NOT EXISTS idx_inv_tx_item ON inventory_transactions(item_id);
        CREATE INDEX IF NOT EXISTS idx_inv_tx_date ON inventory_transactions(date);
        CREATE INDEX IF NOT EXISTS idx_health_animal ON health_cases(animal_id);
        CREATE INDEX IF NOT EXISTS idx_health_status ON health_cases(status);
        CREATE INDEX IF NOT EXISTS idx_vaccine_animal ON vaccination_records(animal_id);
        CREATE INDEX IF NOT EXISTS idx_vaccine_due ON vaccination_records(next_due_date, status);
        CREATE INDEX IF NOT EXISTS idx_breeding_animal ON breeding_records(animal_id);
        CREATE INDEX IF NOT EXISTS idx_growth_animal ON growth_measurements(animal_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_cust ON delivery_invoices(customer_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_date ON delivery_invoices(date);
        CREATE INDEX IF NOT EXISTS idx_invoices_status ON delivery_invoices(status);
        CREATE INDEX IF NOT EXISTS idx_payments_inv ON payments(invoice_id);
        CREATE INDEX IF NOT EXISTS idx_payments_cust ON payments(customer_id);
        CREATE INDEX IF NOT EXISTS idx_worker_tx ON worker_transactions(worker_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_expenses_cat ON expenses(category);
        CREATE INDEX IF NOT EXISTS idx_tasks_due ON farm_tasks(due_date, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_auto ON farm_tasks(auto_key);
        CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module, record_id);
        CREATE INDEX IF NOT EXISTS idx_attach_entity ON attachment_metadata(entity_type, entity_id);
      `);
    },
  },
  {
    version: 3,
    name: '003_milk_corrections_audit',
    up: (db: IDatabaseAdapter) => {
      db.exec(`
        -- Dedicated table for tracking shift unlocking and milk value corrections
        CREATE TABLE IF NOT EXISTS milk_corrections_audit (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          shift TEXT NOT NULL,
          animal_id TEXT,
          original_litres REAL,
          corrected_litres REAL,
          original_fat REAL,
          corrected_fat REAL,
          original_snf REAL,
          corrected_snf REAL,
          reason TEXT NOT NULL,
          user_name TEXT NOT NULL,
          timestamp TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_milk_corr_date ON milk_corrections_audit(date, shift);
      `);
    },
  },
  {
    version: 5,
    name: '005_seed_demo_data',
    up: (db: IDatabaseAdapter) => {
      const animalCount = db.get<{ count: number }>('SELECT count(*) as count FROM animals')?.count || 0;
      if (animalCount === 0) {
        const now = new Date().toISOString();
        const today = now.slice(0, 10);

        // 1. Seed Groups
        const groups = ['Milking Group A', 'Milking Group B', 'Dry Cows', 'Calves & Heifers'];
        for (const g of groups) {
          db.run('INSERT OR IGNORE INTO groups_list (name) VALUES (?)', [g]);
        }

        // 2. Seed Animals
        const demoAnimals = [
          { id: 'ANIMAL-001', cow_number: '101', tag1: 'PK-101', tag2: 'BLUE-01', sex: 'Female', dob: '2021-03-15', breed: 'Holstein Friesian', group_name: 'Milking Group A', stage: 'Lactating', repro_status: 'Pregnant', milk_status: 'Milking', status: 'Active', purchase_price: 320000, supplier: 'Punjab Dairy Farm' },
          { id: 'ANIMAL-002', cow_number: '102', tag1: 'PK-102', tag2: 'BLUE-02', sex: 'Female', dob: '2020-07-20', breed: 'Sahiwal Pure', group_name: 'Milking Group A', stage: 'Lactating', repro_status: 'Inseminated', milk_status: 'Milking', status: 'Active', purchase_price: 280000, supplier: 'Sahiwal Breeding Center' },
          { id: 'ANIMAL-003', cow_number: '103', tag1: 'PK-103', tag2: 'RED-03', sex: 'Female', dob: '2022-01-10', breed: 'Jersey Cross', group_name: 'Milking Group B', stage: 'Lactating', repro_status: 'Open', milk_status: 'Milking', status: 'Active', purchase_price: 250000, supplier: 'Al-Rehman Traders' },
          { id: 'ANIMAL-004', cow_number: '104', tag1: 'PK-104', tag2: 'YELLOW-04', sex: 'Female', dob: '2019-11-05', breed: 'Holstein Friesian', group_name: 'Dry Cows', stage: 'Dry', repro_status: 'Pregnant', milk_status: 'Dry', status: 'Active', purchase_price: 310000, supplier: 'Punjab Dairy Farm' },
          { id: 'ANIMAL-005', cow_number: '105', tag1: 'PK-105', tag2: 'GREEN-05', sex: 'Female', dob: '2023-05-12', breed: 'Sahiwal Cross', group_name: 'Calves & Heifers', stage: 'Heifer', repro_status: 'Open', milk_status: 'Dry', status: 'Active', purchase_price: 120000, supplier: 'Home Bred' },
          { id: 'ANIMAL-006', cow_number: '106', tag1: 'PK-106', tag2: 'WHITE-06', sex: 'Female', dob: '2021-09-01', breed: 'Crossbred Heavy', group_name: 'Milking Group B', stage: 'Lactating', repro_status: 'Pregnant', milk_status: 'Milking', status: 'Active', purchase_price: 290000, supplier: 'Pak Dairy Import' }
        ];

        for (const a of demoAnimals) {
          db.run(
            `INSERT INTO animals (id, cow_number, tag1, tag2, sex, dob, breed, group_name, stage, repro_status, milk_status, status, purchase_date, purchase_price, supplier, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.id, a.cow_number, a.tag1, a.tag2, a.sex, a.dob, a.breed, a.group_name, a.stage, a.repro_status, a.milk_status, a.status, '2023-01-01', a.purchase_price, a.supplier, now, now]
          );
        }

        // 3. Seed Customers
        const demoCustomers = [
          { id: 'CUST-001', name: 'Al-Fateh Dairy Outlet', phone: '+92 300 1234567', rate: 220, terms: 7, status: 'Active' },
          { id: 'CUST-002', name: 'Gourmet Foods & Bakery', phone: '+92 321 9876543', rate: 215, terms: 15, status: 'Active' },
          { id: 'CUST-003', name: 'Local Milk Shop Model Town', phone: '+92 333 4567890', rate: 210, terms: 7, status: 'Active' }
        ];
        for (const c of demoCustomers) {
          db.run(
            `INSERT OR IGNORE INTO customers (id, name, phone, default_rate_per_l, payment_terms_days, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.name, c.phone, c.rate, c.terms, c.status, now]
          );
        }

        // 4. Seed Inventory Items
        const demoInventory = [
          { id: 'INV-001', name: 'Wheat Straw (Bhoosa)', category: 'Dry Fodder', stock: 1500, unit: 'KG', min_stock: 500, daily: 150 },
          { id: 'INV-002', name: 'Green Fodder (SSG / Maize)', category: 'Green Fodder', stock: 4000, unit: 'KG', min_stock: 1000, daily: 600 },
          { id: 'INV-003', name: 'High Yield Dairy Vanda (20% CP)', category: 'Concentrate', stock: 2000, unit: 'KG', min_stock: 400, daily: 180 },
          { id: 'INV-004', name: 'Mineral Mix Powder', category: 'Supplements', stock: 80, unit: 'KG', min_stock: 20, daily: 5 }
        ];
        for (const i of demoInventory) {
          db.run(
            `INSERT OR IGNORE INTO inventory_items (id, name, category, current_stock, unit, min_stock_threshold, avg_daily_consumption, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [i.id, i.name, i.category, i.stock, i.unit, i.min_stock, i.daily, now]
          );
        }

        // 5. Seed Feed Types
        const feedTypes = [
          { id: 'FEED-001', name: 'High Yield Vanda', price: 95.0 },
          { id: 'FEED-002', name: 'Wheat Straw (Bhoosa)', price: 25.0 },
          { id: 'FEED-003', name: 'Silage / Green Feed', price: 18.5 }
        ];
        for (const ft of feedTypes) {
          db.run('INSERT OR IGNORE INTO feed_types (id, name, default_price_per_kg) VALUES (?, ?, ?)', [ft.id, ft.name, ft.price]);
        }

        // 6. Seed Milk Entries for Today
        db.run(
          `INSERT OR IGNORE INTO milk_total_entries (id, date, shift, total_litres, fat_percent, snf_percent, mode, locked, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['MILK-TOT-01', today, 'Morning', 94.5, 4.1, 8.6, 'TOTAL_MANUAL', 0, 'Morning shift completed smoothly', now, now]
        );
        db.run(
          `INSERT OR IGNORE INTO milk_total_entries (id, date, shift, total_litres, fat_percent, snf_percent, mode, locked, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['MILK-TOT-02', today, 'Evening', 86.0, 4.3, 8.7, 'TOTAL_MANUAL', 0, 'Evening shift logged', now, now]
        );

        // 7. Seed Delivery Invoice
        db.run(
          `INSERT OR IGNORE INTO delivery_invoices (
            id, invoice_number, customer_id, customer_name, date, time, litres, rate_per_l, total_amount, payment_terms, due_date, paid_amount, remaining_balance, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'INV-2026-001', 'INV-1001', 'CUST-001', 'Al-Fateh Dairy Outlet', today, '09:00', 150, 220, 33000, '7 Days', today, 20000, 13000, 'Partially Paid', now, now
          ]
        );

        // 8. Seed Workers
        db.run(
          `INSERT OR IGNORE INTO workers (id, name, phone, role, joining_date, monthly_salary, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['WORKER-001', 'Mohammad Imran', '+92 301 5551234', 'Head Milker', '2023-02-01', 45000, 'Active', now]
        );
        db.run(
          `INSERT OR IGNORE INTO workers (id, name, phone, role, joining_date, monthly_salary, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['WORKER-002', 'Ali Hassan', '+92 302 4445678', 'Feed Manager', '2023-06-15', 38000, 'Active', now]
        );
      }
    },
  },
  {
    version: 6,
    name: '006_seed_100_animals_and_90day_history',
    up: (db: IDatabaseAdapter) => {
      const count = db.get<{ count: number }>('SELECT count(*) as count FROM animals')?.count || 0;
      if (count < 100) {
        const now = new Date().toISOString();
        const todayDate = new Date();

        const breeds = ['Holstein Friesian', 'Sahiwal Pure', 'Jersey Cross', 'Cholistani', 'Crossbred Heavy'];
        const groups = ['Milking Group A', 'Milking Group B', 'Dry Cows', 'Calves & Heifers', 'Bulls'];

        for (const g of groups) {
          db.run('INSERT OR IGNORE INTO groups_list (name) VALUES (?)', [g]);
        }

        // Generate 100 animals (Males, Females, Pregnant & Milking cows, Dry cows, Calves)
        for (let i = count + 1; i <= 100; i++) {
          const num = 100 + i;
          const id = `ANIMAL-${String(num).padStart(3, '0')}`;
          const cowNumber = String(num);
          const tag1 = `TAG-PK-${num}`;
          const tag2 = `EAR-${(i % 5) + 1}-${num}`;

          let sex = 'Female';
          let stage = 'Lactating';
          let repro = 'Open';
          let milkStatus = 'Milking';
          let group = 'Milking Group A';
          let breed = breeds[i % breeds.length];

          if (i <= 15) {
            // Males (Bulls & Male Calves)
            sex = 'Male';
            stage = i <= 5 ? 'Calf' : 'Bull';
            repro = 'Open';
            milkStatus = 'Dry';
            group = i <= 5 ? 'Calves & Heifers' : 'Bulls';
          } else if (i <= 38) {
            // PREGNANT & MILKING COWS (Explicitly requested: Cow is Pregnant AND currently Milking!)
            sex = 'Female';
            stage = 'Lactating';
            repro = 'Pregnant';
            milkStatus = 'Milking';
            group = i % 2 === 0 ? 'Milking Group A' : 'Milking Group B';
          } else if (i <= 72) {
            // Lactating Cows (Inseminated or Open)
            sex = 'Female';
            stage = 'Lactating';
            repro = i % 2 === 0 ? 'Inseminated' : 'Open';
            milkStatus = 'Milking';
            group = i % 2 === 0 ? 'Milking Group A' : 'Milking Group B';
          } else if (i <= 88) {
            // Dry Cows (Pregnant)
            sex = 'Female';
            stage = 'Dry';
            repro = 'Pregnant';
            milkStatus = 'Dry';
            group = 'Dry Cows';
          } else {
            // Heifers & Female Calves
            sex = 'Female';
            stage = i <= 95 ? 'Heifer' : 'Calf';
            repro = 'Open';
            milkStatus = 'Dry';
            group = 'Calves & Heifers';
          }

          const birthDaysAgo = (100 - i) * 15 + 300;
          const dobDate = new Date(todayDate.getTime() - birthDaysAgo * 86400000);
          const dobStr = dobDate.toISOString().slice(0, 10);
          const price = 150000 + (i * 2500) % 200000;

          db.run(
            `INSERT OR IGNORE INTO animals (
              id, cow_number, tag1, tag2, sex, dob, breed, group_name, stage, repro_status, milk_status, status, purchase_date, purchase_price, supplier, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', '2023-01-15', ?, 'Pakistan Dairy Breeders', ?, ?)`,
            [id, cowNumber, tag1, tag2, sex, dobStr, breed, group, stage, repro, milkStatus, price, now, now]
          );
        }

        // Generate 90 Days of Historical Milk & Invoices
        const customers = [
          { id: 'CUST-001', name: 'Al-Fateh Dairy Outlet', rate: 220 },
          { id: 'CUST-002', name: 'Gourmet Foods & Bakery', rate: 215 },
          { id: 'CUST-003', name: 'Local Milk Shop Model Town', rate: 210 },
          { id: 'CUST-004', name: 'Anarkali Sweet House', rate: 225 }
        ];

        for (const c of customers) {
          db.run(
            `INSERT OR IGNORE INTO customers (id, name, phone, default_rate_per_l, payment_terms_days, status, created_at)
             VALUES (?, ?, '+92 300 0000000', ?, 7, 'Active', ?)`,
            [c.id, c.name, c.rate, now]
          );
        }

        for (let d = 90; d >= 0; d--) {
          const dDate = new Date(todayDate.getTime() - d * 86400000);
          const dateStr = dDate.toISOString().slice(0, 10);

          // Morning Shift Total
          const morL = 850 + (d * 7) % 120;
          const morFat = 4.1 + (d % 4) * 0.1;
          const morSnf = 8.5 + (d % 3) * 0.1;
          db.run(
            `INSERT OR IGNORE INTO milk_total_entries (id, date, shift, total_litres, fat_percent, snf_percent, mode, locked, notes, created_at, updated_at)
             VALUES (?, ?, 'Morning', ?, ?, ?, 'TOTAL_MANUAL', 1, 'Morning Shift Automated Log', ?, ?)`,
            [`MILK-M-${dateStr}`, dateStr, morL, morFat, morSnf, now, now]
          );

          // Evening Shift Total
          const eveL = 780 + (d * 5) % 110;
          const eveFat = 4.3 + (d % 3) * 0.1;
          const eveSnf = 8.6 + (d % 4) * 0.1;
          db.run(
            `INSERT OR IGNORE INTO milk_total_entries (id, date, shift, total_litres, fat_percent, snf_percent, mode, locked, notes, created_at, updated_at)
             VALUES (?, ?, 'Evening', ?, ?, ?, 'TOTAL_MANUAL', 1, 'Evening Shift Automated Log', ?, ?)`,
            [`MILK-E-${dateStr}`, dateStr, eveL, eveFat, eveSnf, now, now]
          );

          // Weekly Invoices over 90 days
          if (d % 7 === 0) {
            const cust = customers[d % customers.length];
            const litres = Math.round((morL + eveL) * 3);
            const amount = litres * cust.rate;
            const invStatus = d > 30 ? 'Paid' : (d === 0 ? 'Partially Paid' : 'Pending');
            const paid = invStatus === 'Paid' ? amount : (invStatus === 'Partially Paid' ? Math.floor(amount * 0.6) : 0);
            const remaining = amount - paid;

            const invId = `INV-90D-${d}`;
            db.run(
              `INSERT OR IGNORE INTO delivery_invoices (
                id, invoice_number, customer_id, customer_name, date, time, litres, rate_per_l, total_amount, payment_terms, due_date, paid_amount, remaining_balance, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, '09:00', ?, ?, ?, '7 Days', ?, ?, ?, ?, ?, ?)`,
              [invId, `INV-90D-${1000 + d}`, cust.id, cust.name, dateStr, litres, cust.rate, amount, dateStr, paid, remaining, invStatus, now, now]
            );

            if (paid > 0) {
              db.run(
                `INSERT OR IGNORE INTO payments (id, invoice_id, customer_id, date, amount, method, reference, created_at)
                 VALUES (?, ?, ?, ?, ?, 'Bank Transfer', 'REF-PAY-90D', ?)`,
                [`PAY-${d}`, invId, cust.id, dateStr, paid, now]
              );
            }
          }
        }
      }
    },
  },
];

export class MigrationRunner {
  static runMigrations(db: IDatabaseAdapter): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedRows = db.all<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version ASC');
    const appliedVersions = new Set(appliedRows.map(r => r.version));

    for (const m of migrations) {
      if (!appliedVersions.has(m.version)) {
        console.log(`Applying migration ${m.version}: ${m.name}`);
        m.up(db);
        db.run('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)', [
          m.version,
          m.name,
          new Date().toISOString(),
        ]);
        console.log(`✓ Migration ${m.version} applied.`);
      }
    }
  }
}
