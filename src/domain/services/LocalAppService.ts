/**
 * Local Application Service for Dairy Farm ERP
 * Executes domain services directly in-process against local SQLite repository adapters.
 * Enables 100% standalone offline operation on Android and in the browser WITHOUT Express.
 */

import { IDatabaseAdapter, IFileStorageAdapter } from '../../infrastructure/platform/interfaces.ts';
import {
  SQLiteAnimalRepository,
  SQLiteMilkRepository,
  SQLiteFeedRepository,
  SQLiteInventoryRepository,
  SQLiteHealthRepository,
  SQLiteVaccinationRepository,
  SQLiteBreedingRepository,
  SQLiteGrowthRepository,
  SQLiteCustomerRepository,
  SQLiteDeliveryRepository,
  SQLitePaymentRepository,
  SQLiteWorkerRepository,
  SQLiteExpenseRepository,
  SQLiteReminderRepository,
  SQLiteSettingsRepository,
  SQLiteAuditRepository,
  SQLiteAttachmentRepository,
} from '../../infrastructure/database/repositories.ts';
import { AnimalService } from './AnimalService.ts';
import { MilkCalculationService } from './MilkCalculationService.ts';
import { FeedInventoryService } from './FeedInventoryService.ts';
import { HealthBreedingService } from './HealthBreedingService.ts';
import { SalesInvoiceService } from './SalesInvoiceService.ts';
import { ReminderService } from './ReminderService.ts';
import { ReportService } from './ReportService.ts';
import { AuditBackupService } from './AuditBackupService.ts';
import { CsvDataService } from './CsvDataService.ts';

export class LocalAppService {
  private initialized = false;
  public csvService!: CsvDataService;

  // Repositories
  public animalRepo!: SQLiteAnimalRepository;
  public milkRepo!: SQLiteMilkRepository;
  public feedRepo!: SQLiteFeedRepository;
  public inventoryRepo!: SQLiteInventoryRepository;
  public healthRepo!: SQLiteHealthRepository;
  public vaccineRepo!: SQLiteVaccinationRepository;
  public breedingRepo!: SQLiteBreedingRepository;
  public growthRepo!: SQLiteGrowthRepository;
  public customerRepo!: SQLiteCustomerRepository;
  public deliveryRepo!: SQLiteDeliveryRepository;
  public paymentRepo!: SQLitePaymentRepository;
  public workerRepo!: SQLiteWorkerRepository;
  public expenseRepo!: SQLiteExpenseRepository;
  public reminderRepo!: SQLiteReminderRepository;
  public settingsRepo!: SQLiteSettingsRepository;
  public auditRepo!: SQLiteAuditRepository;
  public attachmentRepo!: SQLiteAttachmentRepository;

  // Domain Services
  public animalService!: AnimalService;
  public milkService!: MilkCalculationService;
  public feedService!: FeedInventoryService;
  public healthBreedingService!: HealthBreedingService;
  public salesService!: SalesInvoiceService;
  public reminderService!: ReminderService;
  public reportService!: ReportService;
  public auditBackupService!: AuditBackupService;

  constructor(
    private db: IDatabaseAdapter,
    private storage?: IFileStorageAdapter
  ) {}

  async init(): Promise<void> {
    if (this.initialized) return;

    await this.db.init();

    // Wire up repositories
    this.animalRepo = new SQLiteAnimalRepository(this.db);
    this.milkRepo = new SQLiteMilkRepository(this.db);
    this.feedRepo = new SQLiteFeedRepository(this.db);
    this.inventoryRepo = new SQLiteInventoryRepository(this.db);
    this.healthRepo = new SQLiteHealthRepository(this.db);
    this.vaccineRepo = new SQLiteVaccinationRepository(this.db);
    this.breedingRepo = new SQLiteBreedingRepository(this.db);
    this.growthRepo = new SQLiteGrowthRepository(this.db);
    this.customerRepo = new SQLiteCustomerRepository(this.db);
    this.deliveryRepo = new SQLiteDeliveryRepository(this.db);
    this.paymentRepo = new SQLitePaymentRepository(this.db);
    this.workerRepo = new SQLiteWorkerRepository(this.db);
    this.expenseRepo = new SQLiteExpenseRepository(this.db);
    this.reminderRepo = new SQLiteReminderRepository(this.db);
    this.settingsRepo = new SQLiteSettingsRepository(this.db);
    this.auditRepo = new SQLiteAuditRepository(this.db);
    this.attachmentRepo = new SQLiteAttachmentRepository(this.db);

    // Wire up pure domain services
    this.animalService = new AnimalService(this.animalRepo, this.auditRepo);
    this.milkService = new MilkCalculationService(
      this.milkRepo,
      this.animalRepo,
      this.healthRepo,
      this.reminderRepo,
      this.auditRepo
    );
    this.feedService = new FeedInventoryService(
      this.feedRepo,
      this.inventoryRepo,
      this.reminderRepo,
      this.auditRepo
    );
    this.healthBreedingService = new HealthBreedingService(
      this.healthRepo,
      this.vaccineRepo,
      this.breedingRepo,
      this.growthRepo,
      this.animalRepo,
      this.reminderRepo,
      this.auditRepo
    );
    this.salesService = new SalesInvoiceService(
      this.deliveryRepo,
      this.paymentRepo,
      this.customerRepo,
      this.workerRepo,
      this.expenseRepo,
      this.reminderRepo,
      this.auditRepo
    );
    this.reminderService = new ReminderService(
      this.reminderRepo,
      this.milkRepo,
      this.inventoryRepo,
      this.deliveryRepo,
      this.vaccineRepo,
      this.breedingRepo,
      this.healthRepo,
      this.settingsRepo
    );
    this.reportService = new ReportService(
      this.milkRepo,
      this.feedRepo,
      this.deliveryRepo,
      this.paymentRepo,
      this.expenseRepo,
      this.animalRepo
    );
    this.auditBackupService = new AuditBackupService(
      this.animalRepo,
      this.milkRepo,
      this.feedRepo,
      this.inventoryRepo,
      this.healthRepo,
      this.vaccineRepo,
      this.breedingRepo,
      this.growthRepo,
      this.customerRepo,
      this.deliveryRepo,
      this.paymentRepo,
      this.workerRepo,
      this.expenseRepo,
      this.reminderRepo,
      this.settingsRepo,
      this.auditRepo
    );
    this.csvService = new CsvDataService(this.db);

    await this.reminderService.runStartupEvaluation();
    this.initialized = true;
  }

  private async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // --- ANIMALS ---
  async getAnimals(params?: { sex?: 'Female' | 'Male'; status?: string; group?: string }) {
    await this.ensureInit();
    return this.animalService.listAnimals(params);
  }

  async getAnimal(id: string) {
    await this.ensureInit();
    return this.animalService.getAnimal(id);
  }

  async createAnimal(data: any) {
    await this.ensureInit();
    return this.animalService.registerAnimal(data);
  }

  async updateAnimal(id: string, data: any) {
    await this.ensureInit();
    return this.animalService.updateAnimal(id, data, data.reason);
  }

  async markSold(id: string, data: { saleDate: string; buyer: string; salePrice: number; notes?: string }) {
    await this.ensureInit();
    return this.animalService.markSold(id, data.saleDate, data.buyer, data.salePrice, data.notes);
  }

  async markDeceased(id: string, data: { deathDate: string; deathReason: string; notes?: string }) {
    await this.ensureInit();
    return this.animalService.markDeceased(id, data.deathDate, data.deathReason, data.notes);
  }

  async getTimeline(id: string) {
    await this.ensureInit();
    return this.animalService.getTimeline(id);
  }

  async bulkUpdateGroup(animalIds: string[], newGroup: string, reason?: string) {
    await this.ensureInit();
    return this.animalService.bulkUpdateGroup(animalIds, newGroup, reason);
  }

  // --- MILK ---
  async getMilkShifts() {
    await this.ensureInit();
    return this.milkRepo.getShifts();
  }

  async getMilkTotals(fromDate?: string, toDate?: string) {
    await this.ensureInit();
    return this.milkRepo.listTotalEntries(fromDate, toDate);
  }

  async saveMilkTotal(data: any) {
    await this.ensureInit();
    return this.milkService.saveTotalMilk(data);
  }

  async unlockMilkShift(date: string, shift: string, reason: string) {
    await this.ensureInit();
    return this.milkService.unlockShift(date, shift, reason);
  }

  async getMilkIndividual(date: string, shift: string) {
    await this.ensureInit();
    return this.milkRepo.listIndividualEntries(date, shift);
  }

  async saveMilkIndividual(date: string, shift: string, entries: any[]) {
    await this.ensureInit();
    return this.milkService.saveIndividualShift({ date, shift, entries });
  }

  async getAnimalMilkHistory(animalId: string) {
    await this.ensureInit();
    return this.milkRepo.listAnimalMilkHistory(animalId);
  }

  // --- FEED & INVENTORY ---
  async getFeedTransactions(fromDate?: string, toDate?: string, group?: string) {
    await this.ensureInit();
    return this.feedRepo.listTransactions(fromDate, toDate, group);
  }

  async recordFeed(data: any) {
    await this.ensureInit();
    return this.feedService.recordFeedConsumption(data);
  }

  async getInventoryItems() {
    await this.ensureInit();
    return this.feedService.getInventoryStatus();
  }

  async recordStockMovement(data: any) {
    await this.ensureInit();
    return this.feedService.recordStockMovement(data);
  }

  async getInventoryTransactions(itemId?: string) {
    await this.ensureInit();
    return this.inventoryRepo.listTransactions(itemId);
  }

  // --- HEALTH & VACCINATION ---
  async getHealthCases(animalId?: string, status?: string) {
    await this.ensureInit();
    return this.healthRepo.listCases({ animalId, status });
  }

  async createHealthCase(data: any) {
    await this.ensureInit();
    return this.healthBreedingService.recordHealthCase(data);
  }

  async updateHealthCase(id: string, data: any) {
    await this.ensureInit();
    return this.healthBreedingService.updateHealthCase(id, data);
  }

  async getVaccinations(animalId?: string) {
    await this.ensureInit();
    return this.vaccineRepo.listRecords({ animalId });
  }

  async recordVaccination(data: any) {
    await this.ensureInit();
    return this.healthBreedingService.recordVaccination(data);
  }

  // --- BREEDING & CALVING ---
  async getBreedingRecords(animalId?: string) {
    await this.ensureInit();
    return this.breedingRepo.listRecords(animalId);
  }

  async recordBreedingEvent(data: any) {
    await this.ensureInit();
    return this.healthBreedingService.recordBreedingEvent(data);
  }

  async recordCalving(data: any) {
    await this.ensureInit();
    return this.healthBreedingService.recordCalvingWorkflow(data);
  }

  async getGrowth(animalId: string) {
    await this.ensureInit();
    return this.growthRepo.listByAnimal(animalId);
  }

  async recordGrowth(animalId: string, data: any) {
    await this.ensureInit();
    return this.healthBreedingService.recordGrowthMeasurement({ animalId, ...data });
  }

  // --- CUSTOMERS & INVOICES ---
  async getCustomers() {
    await this.ensureInit();
    return this.customerRepo.listAll();
  }

  async createCustomer(data: any) {
    await this.ensureInit();
    return this.customerRepo.save({
      id: data.id || `CUST_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      address: data.address,
      defaultRatePerL: Number(data.defaultRatePerL || data.rate || 210),
      paymentTermsDays: Number(data.paymentTermsDays || data.terms || 7),
      notes: data.notes,
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
    });
  }

  async getDeliveries(fromDate?: string, toDate?: string, customerId?: string) {
    await this.ensureInit();
    return this.deliveryRepo.listInvoices({ fromDate, toDate, customerId });
  }

  async createDelivery(data: any) {
    await this.ensureInit();
    return this.salesService.createInvoice(data);
  }

  async recordPayment(deliveryId: string, data: any) {
    await this.ensureInit();
    return this.salesService.recordPayment({ invoiceId: deliveryId, ...data });
  }

  async getPayments() {
    await this.ensureInit();
    return this.paymentRepo.listAll();
  }

  // --- WORKERS & EXPENSES ---
  async getWorkers() {
    await this.ensureInit();
    return this.workerRepo.listWorkers();
  }

  async createWorker(data: any) {
    await this.ensureInit();
    return this.workerRepo.saveWorker({
      id: data.id || `WKR_${Date.now()}`,
      name: data.name,
      phone: data.phone,
      role: data.role || 'Milker',
      joiningDate: data.joiningDate || new Date().toISOString().slice(0, 10),
      monthlySalary: Number(data.monthlySalary || 0),
      status: data.status || 'Active',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
  }

  async getWorkerLedger(workerId: string) {
    await this.ensureInit();
    return this.salesService.getWorkerLedger(workerId);
  }

  async recordWorkerTx(workerId: string, data: any) {
    await this.ensureInit();
    return this.salesService.recordWorkerTransaction({ workerId, ...data });
  }

  async getExpenses(fromDate?: string, toDate?: string, category?: string) {
    await this.ensureInit();
    return this.expenseRepo.listExpenses({ fromDate, toDate, category });
  }

  async recordExpense(data: any) {
    await this.ensureInit();
    return this.salesService.recordExpense(data);
  }

  // --- REMINDERS & NOTIFICATIONS ---
  async getTasks(status?: string) {
    await this.ensureInit();
    return this.reminderRepo.listTasks(status);
  }

  async createTask(data: any) {
    await this.ensureInit();
    return this.reminderRepo.saveTask({
      id: data.id || `TASK_${Date.now()}`,
      title: data.title,
      sourceModule: data.sourceModule || 'manual',
      dueDate: data.dueDate || new Date().toISOString().slice(0, 10),
      dueTime: data.dueTime || '09:00',
      status: data.status || 'Due',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
  }

  async completeTask(id: string) {
    await this.ensureInit();
    return this.reminderRepo.completeTask(id);
  }

  async deleteTask(id: string) {
    await this.ensureInit();
    return this.reminderRepo.deleteTask(id);
  }

  async getNotificationsSummary() {
    await this.ensureInit();
    return this.reminderService.getNotificationCenterSummary();
  }

  // --- REPORTS ---
  async getFinancialReport(fromDate?: string, toDate?: string) {
    await this.ensureInit();
    const today = new Date().toISOString().slice(0, 10);
    return this.reportService.generateFinancialReport(fromDate || '2000-01-01', toDate || today);
  }

  async getHerdStatistics() {
    await this.ensureInit();
    return this.reportService.getHerdStatistics();
  }

  // --- SETTINGS, AUDIT & BACKUP ---
  async getSettings() {
    await this.ensureInit();
    return this.settingsRepo.getSettings();
  }

  async saveSettings(data: any) {
    await this.ensureInit();
    return this.settingsRepo.saveSettings(data);
  }

  async getGroups() {
    await this.ensureInit();
    return this.settingsRepo.getGroups();
  }

  async saveGroups(groups: string[]) {
    await this.ensureInit();
    return this.settingsRepo.saveGroups(groups);
  }

  async getDatabaseHealth() {
    await this.ensureInit();
    return this.auditBackupService.getDatabaseHealth();
  }

  async getAuditLogs() {
    await this.ensureInit();
    return this.auditRepo.listLogs();
  }

  validateBackup(content: any) {
    return this.auditBackupService.validateBackupFile(content);
  }

  async generateBackup() {
    await this.ensureInit();
    return this.auditBackupService.generateFullBackup();
  }

  async restoreBackup(payload: any) {
    await this.ensureInit();
    return this.auditBackupService.restoreFromBackup(payload);
  }

  // --- ATTACHMENTS ---
  async saveAttachment(meta: {
    entityType: 'ANIMAL' | 'HEALTH' | 'VACCINE' | 'EXPENSE' | 'INVOICE' | 'OTHER';
    entityId: string;
    fileName: string;
    mimeType: string;
    fileData: Uint8Array | string;
  }) {
    await this.ensureInit();
    let localPath = '';
    if (this.storage) {
      localPath = await this.storage.saveFile(meta.fileName, meta.fileData, meta.mimeType);
    }
    return this.attachmentRepo.saveMetadata({
      id: `ATT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      entityType: meta.entityType,
      entityId: meta.entityId,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      sizeBytes: typeof meta.fileData === 'string' ? meta.fileData.length : meta.fileData.byteLength,
      localPath,
      createdAt: new Date().toISOString(),
    });
  }

  async getAttachments(entityType: string, entityId: string) {
    await this.ensureInit();
    return this.attachmentRepo.getMetadata(entityType, entityId);
  }

  async deleteAttachment(id: string) {
    await this.ensureInit();
    return this.attachmentRepo.deleteMetadata(id);
  }

  // --- CSV IMPORT / EXPORT ---
  async previewCsv(module: 'ANIMALS' | 'MILK' | 'CUSTOMERS', text: string) {
    await this.ensureInit();
    if (module === 'ANIMALS') return this.csvService.previewAnimalsCsv(text);
    if (module === 'MILK') return this.csvService.previewMilkCsv(text);
    return this.csvService.previewCustomersCsv(text);
  }

  async executeCsvImport(preview: any, user: string = 'Operator') {
    await this.ensureInit();
    return this.csvService.executeImport(preview, user);
  }

  async exportAnimalsCsv() {
    await this.ensureInit();
    return this.csvService.exportAnimalsCsv();
  }

  async exportMilkCsv() {
    await this.ensureInit();
    return this.csvService.exportMilkCsv();
  }
}
