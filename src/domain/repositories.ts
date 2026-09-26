/**
 * Repository Interfaces for Dairy Farm ERP
 * Domain Layer depends purely on these interfaces, NOT concrete database implementations.
 */

import {
  Animal,
  AnimalIdentifier,
  StatusHistory,
  MilkTotalEntry,
  MilkIndividualEntry,
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
  MilkShiftConfig,
  MilkCorrectionRecord,
} from './types.ts';

export interface IAnimalRepository {
  findById(id: string): Promise<Animal | null>;
  findByIdentifier(identifier: string): Promise<Animal | null>;
  listAll(filters?: { sex?: 'Female' | 'Male'; status?: string; group?: string }): Promise<Animal[]>;
  create(animal: Animal): Promise<Animal>;
  update(animal: Animal): Promise<Animal>;
  addStatusHistory(history: StatusHistory): Promise<void>;
  getStatusHistory(animalId: string): Promise<StatusHistory[]>;
  addIdentifier(identifier: AnimalIdentifier): Promise<void>;
  getIdentifiers(animalId: string): Promise<AnimalIdentifier[]>;
}

export interface IMilkRepository {
  findTotalEntry(date: string, shift: string): Promise<MilkTotalEntry | null>;
  listTotalEntries(fromDate?: string, toDate?: string): Promise<MilkTotalEntry[]>;
  saveTotalEntry(entry: MilkTotalEntry): Promise<MilkTotalEntry>;
  listIndividualEntries(date: string, shift: string): Promise<MilkIndividualEntry[]>;
  saveIndividualEntries(date: string, shift: string, entries: MilkIndividualEntry[]): Promise<void>;
  listAnimalMilkHistory(animalId: string, limit?: number): Promise<MilkIndividualEntry[]>;
  getShifts(): Promise<MilkShiftConfig[]>;
  saveShift(shift: MilkShiftConfig): Promise<MilkShiftConfig>;
  recordCorrection(record: MilkCorrectionRecord): Promise<void>;
  listCorrections(date?: string, shift?: string): Promise<MilkCorrectionRecord[]>;
}

export interface IFeedRepository {
  listTransactions(fromDate?: string, toDate?: string, group?: string): Promise<FeedTransaction[]>;
  createTransaction(tx: FeedTransaction): Promise<FeedTransaction>;
  deleteTransaction(id: string): Promise<void>;
}

export interface IInventoryRepository {
  listItems(): Promise<InventoryItem[]>;
  findItemById(id: string): Promise<InventoryItem | null>;
  findItemByName(name: string): Promise<InventoryItem | null>;
  saveItem(item: InventoryItem): Promise<InventoryItem>;
  recordTransaction(tx: InventoryTransaction): Promise<InventoryTransaction>;
  listTransactions(itemId?: string, limit?: number): Promise<InventoryTransaction[]>;
}

export interface IHealthRepository {
  listCases(filters?: { animalId?: string; status?: string; fromDate?: string; toDate?: string }): Promise<HealthCase[]>;
  findCaseById(id: string): Promise<HealthCase | null>;
  createCase(healthCase: HealthCase): Promise<HealthCase>;
  updateCase(healthCase: HealthCase): Promise<HealthCase>;
}

export interface IVaccinationRepository {
  listRecords(filters?: { animalId?: string; status?: string; type?: string }): Promise<VaccinationRecord[]>;
  createRecord(record: VaccinationRecord): Promise<VaccinationRecord>;
  updateRecord(record: VaccinationRecord): Promise<VaccinationRecord>;
}

export interface IBreedingRepository {
  listRecords(animalId?: string): Promise<BreedingRecord[]>;
  createRecord(record: BreedingRecord): Promise<BreedingRecord>;
  updateRecord(record: BreedingRecord): Promise<BreedingRecord>;
}

export interface IGrowthRepository {
  listByAnimal(animalId: string): Promise<GrowthMeasurement[]>;
  createMeasurement(measurement: GrowthMeasurement): Promise<GrowthMeasurement>;
}

export interface ICustomerRepository {
  listAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
}

export interface IDeliveryRepository {
  listInvoices(filters?: { customerId?: string; fromDate?: string; toDate?: string; status?: string }): Promise<DeliveryInvoice[]>;
  findById(id: string): Promise<DeliveryInvoice | null>;
  saveInvoice(invoice: DeliveryInvoice): Promise<DeliveryInvoice>;
}

export interface IPaymentRepository {
  listByInvoice(invoiceId: string): Promise<PaymentRecord[]>;
  listByCustomer(customerId: string): Promise<PaymentRecord[]>;
  listAll(fromDate?: string, toDate?: string): Promise<PaymentRecord[]>;
  createPayment(payment: PaymentRecord): Promise<PaymentRecord>;
}

export interface IWorkerRepository {
  listWorkers(): Promise<Worker[]>;
  findWorkerById(id: string): Promise<Worker | null>;
  saveWorker(worker: Worker): Promise<Worker>;
  listTransactions(workerId?: string): Promise<WorkerTransaction[]>;
  createTransaction(tx: WorkerTransaction): Promise<WorkerTransaction>;
}

export interface IExpenseRepository {
  listExpenses(filters?: { category?: string; fromDate?: string; toDate?: string }): Promise<ExpenseRecord[]>;
  createExpense(expense: ExpenseRecord): Promise<ExpenseRecord>;
  updateExpense(expense: ExpenseRecord): Promise<ExpenseRecord>;
}

export interface IReminderRepository {
  listTasks(status?: string): Promise<FarmTaskReminder[]>;
  findTaskByAutoKey(autoKey: string): Promise<FarmTaskReminder | null>;
  saveTask(task: FarmTaskReminder): Promise<FarmTaskReminder>;
  completeTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
}

export interface ISettingsRepository {
  getSettings(): Promise<FarmSettings>;
  saveSettings(settings: FarmSettings): Promise<FarmSettings>;
  getGroups(): Promise<string[]>;
  saveGroups(groups: string[]): Promise<void>;
}

export interface IAuditRepository {
  log(audit: AuditLog): Promise<void>;
  listLogs(limit?: number): Promise<AuditLog[]>;
}

export interface IAttachmentRepository {
  saveMetadata(metadata: AttachmentMetadata): Promise<AttachmentMetadata>;
  getMetadata(entityType: string, entityId: string): Promise<AttachmentMetadata[]>;
  deleteMetadata(id: string): Promise<void>;
}
