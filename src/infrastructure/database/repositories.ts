import { IDatabaseAdapter } from '../platform/interfaces.ts';
import {
  Animal,
  AnimalIdentifier,
  StatusHistory,
  MilkTotalEntry,
  MilkIndividualEntry,
  MilkShiftConfig,
  MilkCorrectionRecord,
  FeedTransaction,
  InventoryItem,
  InventoryTransaction,
  HealthCase,
  VaccinationRecord,
  BreedingRecord,
  GrowthMeasurement,
  Customer,
  DeliveryInvoice,
  PaymentRecord,
  Worker,
  WorkerTransaction,
  ExpenseRecord,
  FarmTaskReminder,
  FarmSettings,
  AuditLog,
  AttachmentMetadata,
} from '../../domain/types.ts';
import {
  IAnimalRepository,
  IMilkRepository,
  IFeedRepository,
  IInventoryRepository,
  IHealthRepository,
  IVaccinationRepository,
  IBreedingRepository,
  IGrowthRepository,
  ICustomerRepository,
  IDeliveryRepository,
  IPaymentRepository,
  IWorkerRepository,
  IExpenseRepository,
  IReminderRepository,
  ISettingsRepository,
  IAuditRepository,
  IAttachmentRepository,
} from '../../domain/repositories.ts';

function mapAnimalRow(r: any): Animal {
  return {
    id: r.id,
    cowNumber: r.cow_number,
    tag1: r.tag1,
    tag2: r.tag2,
    sex: r.sex,
    dob: r.dob,
    breed: r.breed,
    group: r.group_name,
    stage: r.stage,
    reproStatus: r.repro_status,
    milkStatus: r.milk_status,
    status: r.status,
    purchaseDate: r.purchase_date,
    purchasePrice: r.purchase_price,
    supplier: r.supplier,
    notes: r.notes,
    photoUrl: r.photo_url,
    damId: r.dam_id,
    sireId: r.sire_id,
    birthWeight: r.birth_weight,
    weaningDate: r.weaning_date,
    saleDate: r.sale_date,
    salePrice: r.sale_price,
    buyer: r.buyer,
    deathDate: r.death_date,
    deathReason: r.death_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class SQLiteAnimalRepository implements IAnimalRepository {
  constructor(private db: IDatabaseAdapter) {}

  async findById(id: string): Promise<Animal | null> {
    const row = this.db.get('SELECT * FROM animals WHERE id = ?', [id]);
    return row ? mapAnimalRow(row) : null;
  }

  async findByIdentifier(identifier: string): Promise<Animal | null> {
    const row = this.db.get(
      `SELECT a.* FROM animals a
       INNER JOIN animal_identifiers i ON a.id = i.animal_id
       WHERE i.value = ? LIMIT 1`,
      [identifier]
    );
    return row ? mapAnimalRow(row) : null;
  }

  async listAll(filters?: { sex?: 'Female' | 'Male'; status?: string; group?: string }): Promise<Animal[]> {
    let sql = 'SELECT * FROM animals WHERE 1=1';
    const params: any[] = [];
    if (filters?.sex) {
      sql += ' AND sex = ?';
      params.push(filters.sex);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.group) {
      sql += ' AND group_name = ?';
      params.push(filters.group);
    }
    sql += ' ORDER BY id ASC';
    const rows = this.db.all(sql, params);
    return rows.map(mapAnimalRow);
  }

  async create(a: Animal): Promise<Animal> {
    this.db.run(
      `INSERT INTO animals (
        id, cow_number, tag1, tag2, sex, dob, breed, group_name, stage, repro_status,
        milk_status, status, purchase_date, purchase_price, supplier, notes, photo_url,
        dam_id, sire_id, birth_weight, weaning_date, sale_date, sale_price, buyer,
        death_date, death_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        a.purchaseDate,
        a.purchasePrice,
        a.supplier,
        a.notes,
        a.photoUrl,
        a.damId,
        a.sireId,
        a.birthWeight,
        a.weaningDate,
        a.saleDate,
        a.salePrice,
        a.buyer,
        a.deathDate,
        a.deathReason,
        a.createdAt,
        a.updatedAt,
      ]
    );
    return a;
  }

  async update(a: Animal): Promise<Animal> {
    this.db.run(
      `UPDATE animals SET
        cow_number = ?, tag1 = ?, tag2 = ?, sex = ?, dob = ?, breed = ?, group_name = ?,
        stage = ?, repro_status = ?, milk_status = ?, status = ?, purchase_date = ?,
        purchase_price = ?, supplier = ?, notes = ?, photo_url = ?, dam_id = ?, sire_id = ?,
        birth_weight = ?, weaning_date = ?, sale_date = ?, sale_price = ?, buyer = ?,
        death_date = ?, death_reason = ?, updated_at = ?
       WHERE id = ?`,
      [
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
        a.purchaseDate,
        a.purchasePrice,
        a.supplier,
        a.notes,
        a.photoUrl,
        a.damId,
        a.sireId,
        a.birthWeight,
        a.weaningDate,
        a.saleDate,
        a.salePrice,
        a.buyer,
        a.deathDate,
        a.deathReason,
        a.updatedAt,
        a.id,
      ]
    );
    return a;
  }

  async addStatusHistory(h: StatusHistory): Promise<void> {
    this.db.run(
      `INSERT INTO status_history (id, animal_id, change_type, old_value, new_value, date, reason, user_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [h.id, h.animalId, h.changeType, h.oldValue, h.newValue, h.date, h.reason, h.user, h.createdAt]
    );
  }

  async getStatusHistory(animalId: string): Promise<StatusHistory[]> {
    const rows = this.db.all('SELECT * FROM status_history WHERE animal_id = ? ORDER BY created_at DESC', [animalId]);
    return rows.map(r => ({
      id: r.id,
      animalId: r.animal_id,
      changeType: r.change_type,
      oldValue: r.old_value,
      newValue: r.new_value,
      date: r.date,
      reason: r.reason,
      user: r.user_name,
      createdAt: r.created_at,
    }));
  }

  async addIdentifier(i: AnimalIdentifier): Promise<void> {
    this.db.run(
      'INSERT OR REPLACE INTO animal_identifiers (id, animal_id, type, value) VALUES (?, ?, ?, ?)',
      [i.id, i.animalId, i.type, i.value]
    );
  }

  async getIdentifiers(animalId: string): Promise<AnimalIdentifier[]> {
    const rows = this.db.all('SELECT * FROM animal_identifiers WHERE animal_id = ?', [animalId]);
    return rows.map(r => ({
      id: r.id,
      animalId: r.animal_id,
      type: r.type,
      value: r.value,
    }));
  }
}

export class SQLiteMilkRepository implements IMilkRepository {
  constructor(private db: IDatabaseAdapter) {}

  async findTotalEntry(date: string, shift: string): Promise<MilkTotalEntry | null> {
    const row = this.db.get('SELECT * FROM milk_total_entries WHERE date = ? AND shift = ?', [date, shift]);
    if (!row) return null;
    return {
      id: row.id,
      date: row.date,
      shift: row.shift,
      totalLitres: row.total_litres,
      fatPercent: row.fat_percent,
      snfPercent: row.snf_percent,
      mode: row.mode,
      locked: Boolean(row.locked),
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listTotalEntries(fromDate?: string, toDate?: string): Promise<MilkTotalEntry[]> {
    let sql = 'SELECT * FROM milk_total_entries WHERE 1=1';
    const params: any[] = [];
    if (fromDate) {
      sql += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      sql += ' AND date <= ?';
      params.push(toDate);
    }
    sql += ' ORDER BY date DESC, shift DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      shift: r.shift,
      totalLitres: r.total_litres,
      fatPercent: r.fat_percent,
      snfPercent: r.snf_percent,
      mode: r.mode,
      locked: Boolean(r.locked),
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async saveTotalEntry(entry: MilkTotalEntry): Promise<MilkTotalEntry> {
    this.db.run(
      `INSERT OR REPLACE INTO milk_total_entries (
        id, date, shift, total_litres, fat_percent, snf_percent, mode, locked, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.date,
        entry.shift,
        entry.totalLitres,
        entry.fatPercent,
        entry.snfPercent,
        entry.mode,
        entry.locked ? 1 : 0,
        entry.notes,
        entry.createdAt,
        entry.updatedAt,
      ]
    );
    return entry;
  }

  async listIndividualEntries(date: string, shift: string): Promise<MilkIndividualEntry[]> {
    const rows = this.db.all('SELECT * FROM milk_individual_entries WHERE date = ? AND shift = ? ORDER BY animal_id ASC', [
      date,
      shift,
    ]);
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      shift: r.shift,
      animalId: r.animal_id,
      litres: r.litres,
      fatPercent: r.fat_percent,
      snfPercent: r.snf_percent,
      reason: r.reason,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async saveIndividualEntries(date: string, shift: string, entries: MilkIndividualEntry[]): Promise<void> {
    this.db.run('DELETE FROM milk_individual_entries WHERE date = ? AND shift = ?', [date, shift]);
    for (const e of entries) {
      this.db.run(
        `INSERT INTO milk_individual_entries (
          id, date, shift, animal_id, litres, fat_percent, snf_percent, reason, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          e.date,
          e.shift,
          e.animalId,
          e.litres,
          e.fatPercent,
          e.snfPercent,
          e.reason,
          e.notes,
          e.createdAt,
          e.updatedAt,
        ]
      );
    }
  }

  async listAnimalMilkHistory(animalId: string, limit: number = 30): Promise<MilkIndividualEntry[]> {
    const rows = this.db.all(
      'SELECT * FROM milk_individual_entries WHERE animal_id = ? ORDER BY date DESC, shift DESC LIMIT ?',
      [animalId, limit]
    );
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      shift: r.shift,
      animalId: r.animal_id,
      litres: r.litres,
      fatPercent: r.fat_percent,
      snfPercent: r.snf_percent,
      reason: r.reason,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getShifts(): Promise<MilkShiftConfig[]> {
    const rows = this.db.all('SELECT * FROM milk_shifts ORDER BY start_time ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      startTime: r.start_time,
      endTime: r.end_time,
      active: Boolean(r.active),
      reminderMinutes: r.reminder_minutes,
    }));
  }

  async saveShift(shift: MilkShiftConfig): Promise<MilkShiftConfig> {
    this.db.run(
      `INSERT OR REPLACE INTO milk_shifts (id, name, start_time, end_time, active, reminder_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shift.id, shift.name, shift.startTime, shift.endTime, shift.active ? 1 : 0, shift.reminderMinutes]
    );
    return shift;
  }

  async recordCorrection(record: MilkCorrectionRecord): Promise<void> {
    this.db.run(
      `INSERT INTO milk_corrections_audit (
        id, date, shift, animal_id, original_litres, corrected_litres,
        original_fat, corrected_fat, original_snf, corrected_snf,
        reason, user_name, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.date,
        record.shift,
        record.animalId || null,
        record.originalLitres != null ? record.originalLitres : null,
        record.correctedLitres != null ? record.correctedLitres : null,
        record.originalFat != null ? record.originalFat : null,
        record.correctedFat != null ? record.correctedFat : null,
        record.originalSnf != null ? record.originalSnf : null,
        record.correctedSnf != null ? record.correctedSnf : null,
        record.reason,
        record.userName,
        record.timestamp,
      ]
    );
  }

  async listCorrections(date?: string, shift?: string): Promise<MilkCorrectionRecord[]> {
    let sql = 'SELECT * FROM milk_corrections_audit WHERE 1=1';
    const params: any[] = [];
    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    if (shift) {
      sql += ' AND shift = ?';
      params.push(shift);
    }
    sql += ' ORDER BY timestamp DESC';
    const rows = this.db.all(sql, params);
    return rows.map((r: any) => ({
      id: r.id,
      date: r.date,
      shift: r.shift,
      animalId: r.animal_id,
      originalLitres: r.original_litres,
      correctedLitres: r.corrected_litres,
      originalFat: r.original_fat,
      correctedFat: r.corrected_fat,
      originalSnf: r.original_snf,
      correctedSnf: r.corrected_snf,
      reason: r.reason,
      userName: r.user_name,
      timestamp: r.timestamp,
    }));
  }
}

export class SQLiteFeedRepository implements IFeedRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listTransactions(fromDate?: string, toDate?: string, group?: string): Promise<FeedTransaction[]> {
    let sql = 'SELECT * FROM feed_transactions WHERE 1=1';
    const params: any[] = [];
    if (fromDate) {
      sql += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      sql += ' AND date <= ?';
      params.push(toDate);
    }
    if (group) {
      sql += ' AND group_name = ?';
      params.push(group);
    }
    sql += ' ORDER BY date DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      group: r.group_name,
      feedType: r.feed_type,
      maund: r.maund,
      kg: r.kg,
      pricePerKg: r.price_per_kg,
      totalCost: r.total_cost,
      supplier: r.supplier,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createTransaction(tx: FeedTransaction): Promise<FeedTransaction> {
    this.db.run(
      `INSERT INTO feed_transactions (id, date, group_name, feed_type, maund, kg, price_per_kg, total_cost, supplier, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.date,
        tx.group,
        tx.feedType,
        tx.maund,
        tx.kg,
        tx.pricePerKg,
        tx.totalCost,
        tx.supplier,
        tx.notes,
        tx.createdAt,
      ]
    );
    return tx;
  }

  async deleteTransaction(id: string): Promise<void> {
    this.db.run('DELETE FROM feed_transactions WHERE id = ?', [id]);
  }
}

export class SQLiteInventoryRepository implements IInventoryRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listItems(): Promise<InventoryItem[]> {
    const rows = this.db.all('SELECT * FROM inventory_items ORDER BY name ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      currentStock: r.current_stock,
      unit: r.unit,
      minStockThreshold: r.min_stock_threshold,
      avgDailyConsumption: r.avg_daily_consumption,
      updatedAt: r.updated_at,
    }));
  }

  async findItemById(id: string): Promise<InventoryItem | null> {
    const r = this.db.get('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      currentStock: r.current_stock,
      unit: r.unit,
      minStockThreshold: r.min_stock_threshold,
      avgDailyConsumption: r.avg_daily_consumption,
      updatedAt: r.updated_at,
    };
  }

  async findItemByName(name: string): Promise<InventoryItem | null> {
    const r = this.db.get('SELECT * FROM inventory_items WHERE lower(name) = lower(?)', [name]);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      currentStock: r.current_stock,
      unit: r.unit,
      minStockThreshold: r.min_stock_threshold,
      avgDailyConsumption: r.avg_daily_consumption,
      updatedAt: r.updated_at,
    };
  }

  async saveItem(item: InventoryItem): Promise<InventoryItem> {
    this.db.run(
      `INSERT OR REPLACE INTO inventory_items (
        id, name, category, current_stock, unit, min_stock_threshold, avg_daily_consumption, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.name,
        item.category,
        item.currentStock,
        item.unit,
        item.minStockThreshold,
        item.avgDailyConsumption,
        item.updatedAt,
      ]
    );
    return item;
  }

  async recordTransaction(tx: InventoryTransaction): Promise<InventoryTransaction> {
    this.db.run(
      `INSERT INTO inventory_transactions (
        id, item_id, item_name, date, type, quantity, signed_quantity, unit, unit_cost, total_value, reference, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.itemId,
        tx.itemName,
        tx.date,
        tx.type,
        tx.quantity,
        tx.signedQuantity,
        tx.unit,
        tx.unitCost,
        tx.totalValue,
        tx.reference,
        tx.notes,
        tx.createdAt,
      ]
    );
    return tx;
  }

  async listTransactions(itemId?: string, limit: number = 100): Promise<InventoryTransaction[]> {
    let sql = 'SELECT * FROM inventory_transactions WHERE 1=1';
    const params: any[] = [];
    if (itemId) {
      sql += ' AND item_id = ?';
      params.push(itemId);
    }
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(limit);
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      itemId: r.item_id,
      itemName: r.item_name,
      date: r.date,
      type: r.type,
      quantity: r.quantity,
      signedQuantity: r.signed_quantity,
      unit: r.unit,
      unitCost: r.unit_cost,
      totalValue: r.total_value,
      reference: r.reference,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }
}

export class SQLiteHealthRepository implements IHealthRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listCases(filters?: { animalId?: string; status?: string; fromDate?: string; toDate?: string }): Promise<HealthCase[]> {
    let sql = 'SELECT * FROM health_cases WHERE 1=1';
    const params: any[] = [];
    if (filters?.animalId) {
      sql += ' AND animal_id = ?';
      params.push(filters.animalId);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.fromDate) {
      sql += ' AND date >= ?';
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      sql += ' AND date <= ?';
      params.push(filters.toDate);
    }
    sql += ' ORDER BY date DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      animalId: r.animal_id,
      date: r.date,
      problem: r.problem,
      symptoms: r.symptoms,
      diagnosis: r.diagnosis,
      medicine: r.medicine,
      dose: r.dose,
      injection: r.injection,
      provider: r.provider,
      cost: r.cost,
      status: r.status,
      followUpDate: r.follow_up_date,
      recoveryDate: r.recovery_date,
      notes: r.notes,
      source: r.source,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findCaseById(id: string): Promise<HealthCase | null> {
    const r = this.db.get('SELECT * FROM health_cases WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      animalId: r.animal_id,
      date: r.date,
      problem: r.problem,
      symptoms: r.symptoms,
      diagnosis: r.diagnosis,
      medicine: r.medicine,
      dose: r.dose,
      injection: r.injection,
      provider: r.provider,
      cost: r.cost,
      status: r.status,
      followUpDate: r.follow_up_date,
      recoveryDate: r.recovery_date,
      notes: r.notes,
      source: r.source,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async createCase(c: HealthCase): Promise<HealthCase> {
    this.db.run(
      `INSERT INTO health_cases (
        id, animal_id, date, problem, symptoms, diagnosis, medicine, dose, injection,
        provider, cost, status, follow_up_date, recovery_date, notes, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.animalId,
        c.date,
        c.problem,
        c.symptoms,
        c.diagnosis,
        c.medicine,
        c.dose,
        c.injection,
        c.provider,
        c.cost,
        c.status,
        c.followUpDate,
        c.recoveryDate,
        c.notes,
        c.source,
        c.createdAt,
        c.updatedAt,
      ]
    );
    return c;
  }

  async updateCase(c: HealthCase): Promise<HealthCase> {
    this.db.run(
      `UPDATE health_cases SET
        problem = ?, symptoms = ?, diagnosis = ?, medicine = ?, dose = ?, injection = ?,
        provider = ?, cost = ?, status = ?, follow_up_date = ?, recovery_date = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        c.problem,
        c.symptoms,
        c.diagnosis,
        c.medicine,
        c.dose,
        c.injection,
        c.provider,
        c.cost,
        c.status,
        c.followUpDate,
        c.recoveryDate,
        c.notes,
        c.updatedAt,
        c.id,
      ]
    );
    return c;
  }
}

export class SQLiteVaccinationRepository implements IVaccinationRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listRecords(filters?: { animalId?: string; status?: string; type?: string }): Promise<VaccinationRecord[]> {
    let sql = 'SELECT * FROM vaccination_records WHERE 1=1';
    const params: any[] = [];
    if (filters?.animalId) {
      sql += ' AND animal_id = ?';
      params.push(filters.animalId);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.type) {
      sql += ' AND vaccine_type = ?';
      params.push(filters.type);
    }
    sql += ' ORDER BY next_due_date ASC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      animalId: r.animal_id,
      vaccineType: r.vaccine_type,
      lastDate: r.last_date,
      nextDueDate: r.next_due_date,
      product: r.product,
      dose: r.dose,
      provider: r.provider,
      cost: r.cost,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createRecord(v: VaccinationRecord): Promise<VaccinationRecord> {
    this.db.run(
      `INSERT INTO vaccination_records (
        id, animal_id, vaccine_type, last_date, next_due_date, product, dose, provider, cost, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.animalId,
        v.vaccineType,
        v.lastDate,
        v.nextDueDate,
        v.product,
        v.dose,
        v.provider,
        v.cost,
        v.status,
        v.notes,
        v.createdAt,
      ]
    );
    return v;
  }

  async updateRecord(v: VaccinationRecord): Promise<VaccinationRecord> {
    this.db.run(
      `UPDATE vaccination_records SET
        last_date = ?, next_due_date = ?, product = ?, dose = ?, provider = ?, cost = ?, status = ?, notes = ?
       WHERE id = ?`,
      [v.lastDate, v.nextDueDate, v.product, v.dose, v.provider, v.cost, v.status, v.notes, v.id]
    );
    return v;
  }
}

export class SQLiteBreedingRepository implements IBreedingRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listRecords(animalId?: string): Promise<BreedingRecord[]> {
    let sql = 'SELECT * FROM breeding_records WHERE 1=1';
    const params: any[] = [];
    if (animalId) {
      sql += ' AND animal_id = ?';
      params.push(animalId);
    }
    sql += ' ORDER BY date DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      animalId: r.animal_id,
      date: r.date,
      event: r.event,
      sireBreedOrId: r.sire_breed_or_id,
      inseminatorName: r.inseminator_name,
      expectedCalvingDate: r.expected_calving_date,
      recommendedDryOffDate: r.recommended_dry_off_date,
      expectedNextHeatDate: r.expected_next_heat_date,
      actualCalvingDate: r.actual_calving_date,
      followUpDate: r.follow_up_date,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createRecord(b: BreedingRecord): Promise<BreedingRecord> {
    this.db.run(
      `INSERT INTO breeding_records (
        id, animal_id, date, event, sire_breed_or_id, inseminator_name,
        expected_calving_date, recommended_dry_off_date, expected_next_heat_date,
        actual_calving_date, follow_up_date, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.id,
        b.animalId,
        b.date,
        b.event,
        b.sireBreedOrId,
        b.inseminatorName,
        b.expectedCalvingDate,
        b.recommendedDryOffDate,
        b.expectedNextHeatDate,
        b.actualCalvingDate,
        b.followUpDate,
        b.status,
        b.notes,
        b.createdAt,
      ]
    );
    return b;
  }

  async updateRecord(b: BreedingRecord): Promise<BreedingRecord> {
    this.db.run(
      `UPDATE breeding_records SET
        date = ?, event = ?, sire_breed_or_id = ?, inseminator_name = ?,
        expected_calving_date = ?, recommended_dry_off_date = ?, expected_next_heat_date = ?,
        actual_calving_date = ?, follow_up_date = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        b.date,
        b.event,
        b.sireBreedOrId,
        b.inseminatorName,
        b.expectedCalvingDate,
        b.recommendedDryOffDate,
        b.expectedNextHeatDate,
        b.actualCalvingDate,
        b.followUpDate,
        b.status,
        b.notes,
        b.id,
      ]
    );
    return b;
  }
}

export class SQLiteGrowthRepository implements IGrowthRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listByAnimal(animalId: string): Promise<GrowthMeasurement[]> {
    const rows = this.db.all('SELECT * FROM growth_measurements WHERE animal_id = ? ORDER BY date ASC', [animalId]);
    return rows.map(r => ({
      id: r.id,
      animalId: r.animal_id,
      date: r.date,
      weightKg: r.weight_kg,
      ageDaysAtWeighing: r.age_days_at_weighing,
      averageDailyGain: r.average_daily_gain,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createMeasurement(g: GrowthMeasurement): Promise<GrowthMeasurement> {
    this.db.run(
      `INSERT INTO growth_measurements (id, animal_id, date, weight_kg, age_days_at_weighing, average_daily_gain, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.animalId, g.date, g.weightKg, g.ageDaysAtWeighing, g.averageDailyGain, g.notes, g.createdAt]
    );
    return g;
  }
}

export class SQLiteCustomerRepository implements ICustomerRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listAll(): Promise<Customer[]> {
    const rows = this.db.all('SELECT * FROM customers ORDER BY name ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      company: r.company,
      phone: r.phone,
      address: r.address,
      defaultRatePerL: r.default_rate_per_l,
      paymentTermsDays: r.payment_terms_days,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async findById(id: string): Promise<Customer | null> {
    const r = this.db.get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      company: r.company,
      phone: r.phone,
      address: r.address,
      defaultRatePerL: r.default_rate_per_l,
      paymentTermsDays: r.payment_terms_days,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    };
  }

  async save(c: Customer): Promise<Customer> {
    this.db.run(
      `INSERT OR REPLACE INTO customers (id, name, company, phone, address, default_rate_per_l, payment_terms_days, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.company, c.phone, c.address, c.defaultRatePerL, c.paymentTermsDays, c.notes, c.status, c.createdAt]
    );
    return c;
  }
}

export class SQLiteDeliveryRepository implements IDeliveryRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listInvoices(filters?: { customerId?: string; fromDate?: string; toDate?: string; status?: string }): Promise<DeliveryInvoice[]> {
    let sql = 'SELECT * FROM delivery_invoices WHERE 1=1';
    const params: any[] = [];
    if (filters?.customerId) {
      sql += ' AND customer_id = ?';
      params.push(filters.customerId);
    }
    if (filters?.fromDate) {
      sql += ' AND date >= ?';
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      sql += ' AND date <= ?';
      params.push(filters.toDate);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY date DESC, time DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      receiverName: r.receiver_name,
      date: r.date,
      time: r.time,
      litres: r.litres,
      fatPercent: r.fat_percent,
      snfPercent: r.snf_percent,
      ratePerL: r.rate_per_l,
      totalAmount: r.total_amount,
      paymentTerms: r.payment_terms,
      dueDate: r.due_date,
      paidAmount: r.paid_amount,
      remainingBalance: r.remaining_balance,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string): Promise<DeliveryInvoice | null> {
    const r = this.db.get('SELECT * FROM delivery_invoices WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      invoiceNumber: r.invoice_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      receiverName: r.receiver_name,
      date: r.date,
      time: r.time,
      litres: r.litres,
      fatPercent: r.fat_percent,
      snfPercent: r.snf_percent,
      ratePerL: r.rate_per_l,
      totalAmount: r.total_amount,
      paymentTerms: r.payment_terms,
      dueDate: r.due_date,
      paidAmount: r.paid_amount,
      remainingBalance: r.remaining_balance,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async saveInvoice(inv: DeliveryInvoice): Promise<DeliveryInvoice> {
    this.db.run(
      `INSERT OR REPLACE INTO delivery_invoices (
        id, invoice_number, customer_id, customer_name, receiver_name, date, time, litres,
        fat_percent, snf_percent, rate_per_l, total_amount, payment_terms, due_date,
        paid_amount, remaining_balance, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inv.id,
        inv.invoiceNumber,
        inv.customerId,
        inv.customerName,
        inv.receiverName,
        inv.date,
        inv.time,
        inv.litres,
        inv.fatPercent,
        inv.snfPercent,
        inv.ratePerL,
        inv.totalAmount,
        inv.paymentTerms,
        inv.dueDate,
        inv.paidAmount,
        inv.remainingBalance,
        inv.status,
        inv.notes,
        inv.createdAt,
        inv.updatedAt,
      ]
    );
    return inv;
  }
}

export class SQLitePaymentRepository implements IPaymentRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listByInvoice(invoiceId: string): Promise<PaymentRecord[]> {
    const rows = this.db.all('SELECT * FROM payments WHERE invoice_id = ? ORDER BY date DESC', [invoiceId]);
    return rows.map(r => ({
      id: r.id,
      invoiceId: r.invoice_id,
      customerId: r.customer_id,
      date: r.date,
      amount: r.amount,
      method: r.method,
      reference: r.reference,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async listByCustomer(customerId: string): Promise<PaymentRecord[]> {
    const rows = this.db.all('SELECT * FROM payments WHERE customer_id = ? ORDER BY date DESC', [customerId]);
    return rows.map(r => ({
      id: r.id,
      invoiceId: r.invoice_id,
      customerId: r.customer_id,
      date: r.date,
      amount: r.amount,
      method: r.method,
      reference: r.reference,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async listAll(fromDate?: string, toDate?: string): Promise<PaymentRecord[]> {
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params: any[] = [];
    if (fromDate) {
      sql += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      sql += ' AND date <= ?';
      params.push(toDate);
    }
    sql += ' ORDER BY date DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      invoiceId: r.invoice_id,
      customerId: r.customer_id,
      date: r.date,
      amount: r.amount,
      method: r.method,
      reference: r.reference,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createPayment(p: PaymentRecord): Promise<PaymentRecord> {
    this.db.run(
      'INSERT INTO payments (id, invoice_id, customer_id, date, amount, method, reference, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.invoiceId, p.customerId, p.date, p.amount, p.method, p.reference, p.notes, p.createdAt]
    );
    return p;
  }
}

export class SQLiteWorkerRepository implements IWorkerRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listWorkers(): Promise<Worker[]> {
    const rows = this.db.all('SELECT * FROM workers ORDER BY name ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      role: r.role,
      joiningDate: r.joining_date,
      monthlySalary: r.monthly_salary,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async findWorkerById(id: string): Promise<Worker | null> {
    const r = this.db.get('SELECT * FROM workers WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      role: r.role,
      joiningDate: r.joining_date,
      monthlySalary: r.monthly_salary,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
    };
  }

  async saveWorker(w: Worker): Promise<Worker> {
    this.db.run(
      `INSERT OR REPLACE INTO workers (id, name, phone, role, joining_date, monthly_salary, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.id, w.name, w.phone, w.role, w.joiningDate, w.monthlySalary, w.status, w.notes, w.createdAt]
    );
    return w;
  }

  async listTransactions(workerId?: string): Promise<WorkerTransaction[]> {
    let sql = 'SELECT * FROM worker_transactions WHERE 1=1';
    const params: any[] = [];
    if (workerId) {
      sql += ' AND worker_id = ?';
      params.push(workerId);
    }
    sql += ' ORDER BY date DESC, created_at DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      workerId: r.worker_id,
      workerName: r.worker_name,
      date: r.date,
      type: r.type,
      amount: r.amount,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async createTransaction(tx: WorkerTransaction): Promise<WorkerTransaction> {
    this.db.run(
      'INSERT INTO worker_transactions (id, worker_id, worker_name, date, type, amount, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tx.id, tx.workerId, tx.workerName, tx.date, tx.type, tx.amount, tx.notes, tx.createdAt]
    );
    return tx;
  }
}

export class SQLiteExpenseRepository implements IExpenseRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listExpenses(filters?: { category?: string; fromDate?: string; toDate?: string }): Promise<ExpenseRecord[]> {
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params: any[] = [];
    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.fromDate) {
      sql += ' AND date >= ?';
      params.push(filters.fromDate);
    }
    if (filters?.toDate) {
      sql += ' AND date <= ?';
      params.push(filters.toDate);
    }
    sql += ' ORDER BY date DESC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      category: r.category,
      amount: r.amount,
      vendor: r.vendor,
      paymentMethod: r.payment_method,
      reference: r.reference,
      notes: r.notes,
      attachmentId: r.attachment_id,
      createdAt: r.created_at,
    }));
  }

  async createExpense(e: ExpenseRecord): Promise<ExpenseRecord> {
    this.db.run(
      `INSERT INTO expenses (id, date, category, amount, vendor, payment_method, reference, notes, attachment_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.date, e.category, e.amount, e.vendor, e.paymentMethod, e.reference, e.notes, e.attachmentId, e.createdAt]
    );
    return e;
  }

  async updateExpense(e: ExpenseRecord): Promise<ExpenseRecord> {
    this.db.run(
      `UPDATE expenses SET date = ?, category = ?, amount = ?, vendor = ?, payment_method = ?, reference = ?, notes = ?
       WHERE id = ?`,
      [e.date, e.category, e.amount, e.vendor, e.paymentMethod, e.reference, e.notes, e.id]
    );
    return e;
  }
}

export class SQLiteReminderRepository implements IReminderRepository {
  constructor(private db: IDatabaseAdapter) {}

  async listTasks(status?: string): Promise<FarmTaskReminder[]> {
    let sql = 'SELECT * FROM farm_tasks WHERE 1=1';
    const params: any[] = [];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY due_date ASC, due_time ASC';
    const rows = this.db.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      sourceModule: r.source_module,
      dueDate: r.due_date,
      dueTime: r.due_time,
      status: r.status,
      linkedRecordId: r.linked_record_id,
      autoKey: r.auto_key,
      notes: r.notes,
      completedAt: r.completed_at,
      createdAt: r.created_at,
    }));
  }

  async findTaskByAutoKey(autoKey: string): Promise<FarmTaskReminder | null> {
    const r = this.db.get('SELECT * FROM farm_tasks WHERE auto_key = ?', [autoKey]);
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      sourceModule: r.source_module,
      dueDate: r.due_date,
      dueTime: r.due_time,
      status: r.status,
      linkedRecordId: r.linked_record_id,
      autoKey: r.auto_key,
      notes: r.notes,
      completedAt: r.completed_at,
      createdAt: r.created_at,
    };
  }

  async saveTask(t: FarmTaskReminder): Promise<FarmTaskReminder> {
    this.db.run(
      `INSERT OR REPLACE INTO farm_tasks (
        id, title, source_module, due_date, due_time, status, linked_record_id, auto_key, notes, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.title,
        t.sourceModule,
        t.dueDate,
        t.dueTime,
        t.status,
        t.linkedRecordId,
        t.autoKey,
        t.notes,
        t.completedAt,
        t.createdAt,
      ]
    );
    return t;
  }

  async completeTask(id: string): Promise<void> {
    const now = new Date().toISOString();
    this.db.run('UPDATE farm_tasks SET status = ?, completed_at = ? WHERE id = ?', ['Completed', now, id]);
  }

  async deleteTask(id: string): Promise<void> {
    this.db.run('DELETE FROM farm_tasks WHERE id = ?', [id]);
  }
}

export class SQLiteSettingsRepository implements ISettingsRepository {
  constructor(private db: IDatabaseAdapter) {}

  async getSettings(): Promise<FarmSettings> {
    const r = this.db.get('SELECT * FROM farm_settings LIMIT 1');
    if (!r) {
      throw new Error('Farm settings not initialized');
    }
    return {
      id: r.id,
      farmName: r.farm_name,
      farmAddress: r.farm_address,
      phone: r.phone,
      email: r.email,
      logoUrl: r.logo_url,
      currency: r.currency,
      dateFormat: r.date_format,
      timeFormat: r.time_format,
      weightUnit: r.weight_unit,
      milkUnit: r.milk_unit,
      feedUnit: r.feed_unit,
      timezone: r.timezone,
      defaultPaymentTermsDays: r.default_payment_terms_days,
      defaultMilkShifts: JSON.parse(r.default_milk_shifts || '[]'),
      reminderMinutes: r.reminder_minutes,
      lowStockHorizonDays: r.low_stock_horizon_days,
      updatedAt: r.updated_at,
    };
  }

  async saveSettings(s: FarmSettings): Promise<FarmSettings> {
    this.db.run(
      `INSERT OR REPLACE INTO farm_settings (
        id, farm_name, farm_address, phone, email, logo_url, currency, date_format, time_format,
        weight_unit, milk_unit, feed_unit, timezone, default_payment_terms_days,
        default_milk_shifts, reminder_minutes, low_stock_horizon_days, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.farmName,
        s.farmAddress,
        s.phone,
        s.email,
        s.logoUrl,
        s.currency,
        s.dateFormat,
        s.timeFormat,
        s.weightUnit,
        s.milkUnit,
        s.feedUnit,
        s.timezone,
        s.defaultPaymentTermsDays,
        JSON.stringify(s.defaultMilkShifts),
        s.reminderMinutes,
        s.lowStockHorizonDays,
        s.updatedAt,
      ]
    );
    return s;
  }

  async getGroups(): Promise<string[]> {
    const rows = this.db.all('SELECT name FROM groups_list ORDER BY name ASC');
    return rows.map(r => r.name);
  }

  async saveGroups(groups: string[]): Promise<void> {
    for (const g of groups) {
      this.db.run('INSERT OR IGNORE INTO groups_list (name) VALUES (?)', [g]);
    }
  }
}

export class SQLiteAuditRepository implements IAuditRepository {
  constructor(private db: IDatabaseAdapter) {}

  async log(audit: AuditLog): Promise<void> {
    this.db.run(
      `INSERT INTO audit_logs (id, timestamp, action, module, record_id, old_values, new_values, reason, user_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        audit.id,
        audit.timestamp,
        audit.action,
        audit.module,
        audit.recordId,
        audit.oldValues ? JSON.stringify(audit.oldValues) : null,
        audit.newValues ? JSON.stringify(audit.newValues) : null,
        audit.reason,
        audit.user,
      ]
    );
  }

  async listLogs(limit: number = 100): Promise<AuditLog[]> {
    const rows = this.db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      module: r.module,
      recordId: r.record_id,
      oldValues: r.old_values ? JSON.parse(r.old_values) : undefined,
      newValues: r.new_values ? JSON.parse(r.new_values) : undefined,
      reason: r.reason,
      user: r.user_name,
    }));
  }
}

export class SQLiteAttachmentRepository implements IAttachmentRepository {
  constructor(private db: IDatabaseAdapter) {}

  async saveMetadata(m: AttachmentMetadata): Promise<AttachmentMetadata> {
    this.db.run(
      `INSERT OR REPLACE INTO attachment_metadata (
        id, entity_type, entity_id, file_name, mime_type, size_bytes, local_path, checksum, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.entityType, m.entityId, m.fileName, m.mimeType, m.sizeBytes, m.localPath, m.checksum, m.createdAt]
    );
    return m;
  }

  async getMetadata(entityType: string, entityId: string): Promise<AttachmentMetadata[]> {
    const rows = this.db.all(
      'SELECT * FROM attachment_metadata WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [entityType, entityId]
    );
    return rows.map(r => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      fileName: r.file_name,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
      localPath: r.local_path,
      checksum: r.checksum,
      createdAt: r.created_at,
    }));
  }

  async deleteMetadata(id: string): Promise<void> {
    this.db.run('DELETE FROM attachment_metadata WHERE id = ?', [id]);
  }
}
