/**
 * Robust CSV Import & Export Service for Dairy Farm ERP
 * Features:
 * - Preview & row parsing
 * - Strict schema validation
 * - Duplicate detection
 * - Error reporting
 * - Transactional execution (never silently imports bad rows)
 */

import { IDatabaseAdapter } from '../../infrastructure/platform/interfaces.ts';

export interface CsvValidationIssue {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface CsvImportPreview<T = any> {
  module: 'ANIMALS' | 'MILK' | 'CUSTOMERS' | 'FEED' | 'EXPENSES';
  totalRows: number;
  validRows: T[];
  invalidRows: Array<{ row: number; data: any; issues: CsvValidationIssue[] }>;
  duplicates: Array<{ row: number; identifier: string }>;
  canImport: boolean;
}

export class CsvDataService {
  constructor(private db: IDatabaseAdapter) {}

  // Parse CSV string into array of object rows
  parseCsv(csvText: string): Array<Record<string, string>> {
    const lines = csvText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      // Split preserving quoted commas
      const values: string[] = [];
      let inQuotes = false;
      let currentVal = '';

      for (let c = 0; c < lines[i].length; c++) {
        const char = lines[i][c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }

    return rows;
  }

  // --- ANIMAL CSV ---
  previewAnimalsCsv(csvText: string): CsvImportPreview {
    const rows = this.parseCsv(csvText);
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const duplicates: any[] = [];

    const existingIds = new Set(
      this.db.all<{ id: string }>('SELECT id FROM animals').map((r: { id: string }) => r.id.toLowerCase())
    );

    rows.forEach((r, idx) => {
      const rowNum = idx + 2;
      const issues: CsvValidationIssue[] = [];

      const id = (r.ID || r.id || r['Animal ID'] || '').trim();
      const sex = (r.Sex || r.sex || 'Female').trim();
      const dob = (r.DOB || r.dob || r['Date of Birth'] || '').trim();
      const breed = (r.Breed || r.breed || 'Friesian Cross').trim();
      const group = (r.Group || r.group || r['Group Name'] || 'High').trim();

      if (!id) {
        issues.push({ row: rowNum, field: 'id', value: id, message: 'Animal ID is required' });
      } else if (existingIds.has(id.toLowerCase())) {
        duplicates.push({ row: rowNum, identifier: id });
        issues.push({ row: rowNum, field: 'id', value: id, message: `Animal with ID '${id}' already exists` });
      }

      if (!dob || isNaN(new Date(dob).getTime())) {
        issues.push({ row: rowNum, field: 'dob', value: dob, message: 'Valid Date of Birth (YYYY-MM-DD) is required' });
      }

      if (sex !== 'Female' && sex !== 'Male') {
        issues.push({ row: rowNum, field: 'sex', value: sex, message: 'Sex must be Female or Male' });
      }

      if (issues.length > 0) {
        invalidRows.push({ row: rowNum, data: r, issues });
      } else {
        existingIds.add(id.toLowerCase());
        validRows.push({
          id,
          cowNumber: (r['Cow Number'] || r.cowNumber || id).trim(),
          tag1: (r['Tag 1'] || r.tag1 || '').trim(),
          tag2: (r['Tag 2'] || r.tag2 || '').trim(),
          sex,
          dob,
          breed,
          group,
          stage: sex === 'Female' ? 'Adult' : 'Breeding Bull',
          reproStatus: sex === 'Female' ? 'Milking' : 'Active',
          milkStatus: sex === 'Female' ? 'Milking' : 'Dry',
          status: 'Active',
          notes: r.Notes || r.notes || 'Imported via CSV',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return {
      module: 'ANIMALS',
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicates,
      canImport: validRows.length > 0 && invalidRows.length === 0,
    };
  }

  // --- MILK CSV ---
  previewMilkCsv(csvText: string): CsvImportPreview {
    const rows = this.parseCsv(csvText);
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const duplicates: any[] = [];

    const existingTotals = new Set(
      this.db
        .all<{ date: string; shift: string }>('SELECT date, shift FROM milk_total_entries')
        .map((r: { date: string; shift: string }) => `${r.date}_${r.shift.toLowerCase()}`)
    );

    rows.forEach((r, idx) => {
      const rowNum = idx + 2;
      const issues: CsvValidationIssue[] = [];

      const date = (r.Date || r.date || '').trim();
      const shift = (r.Shift || r.shift || 'Morning').trim();
      const litres = parseFloat(r.Litres || r.litres || r['Total Litres'] || '0');
      const fat = r.Fat || r.fat || r['Fat %'] ? parseFloat(r.Fat || r.fat || r['Fat %']) : undefined;
      const snf = r.SNF || r.snf || r['SNF %'] ? parseFloat(r.SNF || r.snf || r['SNF %']) : undefined;

      if (!date || isNaN(new Date(date).getTime())) {
        issues.push({ row: rowNum, field: 'date', value: date, message: 'Valid Date (YYYY-MM-DD) is required' });
      }

      if (!litres || litres <= 0) {
        issues.push({ row: rowNum, field: 'litres', value: litres, message: 'Litres must be greater than 0' });
      }

      const key = `${date}_${shift.toLowerCase()}`;
      if (existingTotals.has(key)) {
        duplicates.push({ row: rowNum, identifier: `${date} ${shift}` });
        issues.push({ row: rowNum, field: 'shift', value: shift, message: `Shift ${shift} on ${date} already exists` });
      }

      if (issues.length > 0) {
        invalidRows.push({ row: rowNum, data: r, issues });
      } else {
        existingTotals.add(key);
        validRows.push({
          id: `MILK_TOT_${Date.now()}_${idx}`,
          date,
          shift,
          totalLitres: litres,
          fatPercent: fat,
          snfPercent: snf,
          mode: 'total',
          locked: 0,
          notes: r.Notes || r.notes || 'Imported via CSV',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return {
      module: 'MILK',
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicates,
      canImport: validRows.length > 0 && invalidRows.length === 0,
    };
  }

  // --- CUSTOMER CSV ---
  previewCustomersCsv(csvText: string): CsvImportPreview {
    const rows = this.parseCsv(csvText);
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const duplicates: any[] = [];

    const existingNames = new Set(
      this.db.all<{ name: string }>('SELECT name FROM customers').map((r: { name: string }) => r.name.toLowerCase())
    );

    rows.forEach((r, idx) => {
      const rowNum = idx + 2;
      const issues: CsvValidationIssue[] = [];

      const name = (r.Name || r.name || r['Customer Name'] || '').trim();
      const rate = parseFloat(r['Rate per L'] || r.rate || r.defaultRatePerL || '210');
      const terms = parseInt(r['Payment Terms'] || r.terms || r.paymentTermsDays || '7', 10);

      if (!name) {
        issues.push({ row: rowNum, field: 'name', value: name, message: 'Customer name is required' });
      } else if (existingNames.has(name.toLowerCase())) {
        duplicates.push({ row: rowNum, identifier: name });
        issues.push({ row: rowNum, field: 'name', value: name, message: `Customer '${name}' already exists` });
      }

      if (issues.length > 0) {
        invalidRows.push({ row: rowNum, data: r, issues });
      } else {
        existingNames.add(name.toLowerCase());
        validRows.push({
          id: `CUST_${Date.now()}_${idx}`,
          name,
          company: r.Company || r.company || '',
          phone: r.Phone || r.phone || '',
          address: r.Address || r.address || '',
          defaultRatePerL: rate,
          paymentTermsDays: terms,
          status: 'Active',
          notes: r.Notes || r.notes || 'Imported via CSV',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return {
      module: 'CUSTOMERS',
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicates,
      canImport: validRows.length > 0 && invalidRows.length === 0,
    };
  }

  // Transactionally execute import
  executeImport(preview: CsvImportPreview, user: string = 'Operator'): { success: boolean; count: number } {
    if (preview.validRows.length === 0) {
      throw new Error('No valid rows to import.');
    }

    return this.db.transaction(() => {
      const now = new Date().toISOString();

      if (preview.module === 'ANIMALS') {
        for (const a of preview.validRows) {
          this.db.run(
            `INSERT INTO animals (
              id, cow_number, tag1, tag2, sex, dob, breed, group_name,
              stage, repro_status, milk_status, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              a.id,
              a.cowNumber,
              a.tag1,
              a.tag2,
              a.sex,
              a.dob,
              a.breed,
              a.group,
              a.stage,
              a.reproStatus,
              a.milkStatus,
              a.status,
              a.notes,
              a.createdAt,
              a.updatedAt,
            ]
          );

          this.db.run(
            `INSERT INTO animal_identifiers (id, animal_id, type, value) VALUES (?, ?, ?, ?)`,
            [`${a.id}_PRIMARY`, a.id, 'COW_NUMBER', a.id]
          );
        }
      } else if (preview.module === 'MILK') {
        for (const m of preview.validRows) {
          this.db.run(
            `INSERT INTO milk_total_entries (
              id, date, shift, total_litres, fat_percent, snf_percent,
              mode, locked, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              m.id,
              m.date,
              m.shift,
              m.totalLitres,
              m.fatPercent || null,
              m.snfPercent || null,
              m.mode,
              m.locked,
              m.notes,
              m.createdAt,
              m.updatedAt,
            ]
          );
        }
      } else if (preview.module === 'CUSTOMERS') {
        for (const c of preview.validRows) {
          this.db.run(
            `INSERT INTO customers (
              id, name, company, phone, address, default_rate_per_l,
              payment_terms_days, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              c.id,
              c.name,
              c.company,
              c.phone,
              c.address,
              c.defaultRatePerL,
              c.paymentTermsDays,
              c.status,
              c.notes,
              c.createdAt,
            ]
          );
        }
      }

      // Log the CSV import in audit
      this.db.run(
        `INSERT INTO csv_import_logs (id, module, filename, rows_imported, rows_skipped, imported_by, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `CSV_LOG_${Date.now()}`,
          preview.module,
          `${preview.module.toLowerCase()}_import.csv`,
          preview.validRows.length,
          preview.invalidRows.length,
          user,
          now,
        ]
      );

      return { success: true, count: preview.validRows.length };
    });
  }

  // --- EXPORT TO CSV ---
  exportAnimalsCsv(): string {
    const rows = this.db.all('SELECT * FROM animals ORDER BY id ASC');
    const headers = ['ID', 'Cow Number', 'Tag 1', 'Tag 2', 'Sex', 'DOB', 'Breed', 'Group Name', 'Stage', 'Status'];
    const lines = [headers.join(',')];

    for (const r of rows) {
      lines.push(
        [
          `"${r.id}"`,
          `"${r.cow_number || ''}"`,
          `"${r.tag1 || ''}"`,
          `"${r.tag2 || ''}"`,
          `"${r.sex}"`,
          `"${r.dob}"`,
          `"${r.breed}"`,
          `"${r.group_name}"`,
          `"${r.stage}"`,
          `"${r.status}"`,
        ].join(',')
      );
    }
    return lines.join('\n');
  }

  exportMilkCsv(): string {
    const rows = this.db.all('SELECT * FROM milk_total_entries ORDER BY date DESC, shift DESC');
    const headers = ['Date', 'Shift', 'Total Litres', 'Fat %', 'SNF %', 'Locked', 'Notes'];
    const lines = [headers.join(',')];

    for (const r of rows) {
      lines.push(
        [
          `"${r.date}"`,
          `"${r.shift}"`,
          r.total_litres,
          r.fat_percent != null ? r.fat_percent : '',
          r.snf_percent != null ? r.snf_percent : '',
          r.locked ? 'Yes' : 'No',
          `"${(r.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    }
    return lines.join('\n');
  }
}
