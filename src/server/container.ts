import path from 'path';
import { SQLiteDatabase } from '../infrastructure/database/sqliteDb.ts';
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
} from '../infrastructure/database/repositories.ts';
import { AnimalService } from '../domain/services/AnimalService.ts';
import { MilkCalculationService } from '../domain/services/MilkCalculationService.ts';
import { FeedInventoryService } from '../domain/services/FeedInventoryService.ts';
import { HealthBreedingService } from '../domain/services/HealthBreedingService.ts';
import { SalesInvoiceService } from '../domain/services/SalesInvoiceService.ts';
import { ReminderService } from '../domain/services/ReminderService.ts';
import { ReportService } from '../domain/services/ReportService.ts';
import { AuditBackupService } from '../domain/services/AuditBackupService.ts';
import { CsvDataService } from '../domain/services/CsvDataService.ts';
import { BackupManager } from './backupManager.ts';
import { logger } from './logger.ts';

export interface AppRepositories {
  animal: SQLiteAnimalRepository;
  milk: SQLiteMilkRepository;
  feed: SQLiteFeedRepository;
  inventory: SQLiteInventoryRepository;
  health: SQLiteHealthRepository;
  vaccine: SQLiteVaccinationRepository;
  breeding: SQLiteBreedingRepository;
  growth: SQLiteGrowthRepository;
  customer: SQLiteCustomerRepository;
  delivery: SQLiteDeliveryRepository;
  payment: SQLitePaymentRepository;
  worker: SQLiteWorkerRepository;
  expense: SQLiteExpenseRepository;
  reminder: SQLiteReminderRepository;
  settings: SQLiteSettingsRepository;
  audit: SQLiteAuditRepository;
  attachment: SQLiteAttachmentRepository;
}

export interface AppServices {
  animal: AnimalService;
  milk: MilkCalculationService;
  feedInventory: FeedInventoryService;
  healthBreeding: HealthBreedingService;
  salesInvoice: SalesInvoiceService;
  reminder: ReminderService;
  report: ReportService;
  auditBackup: AuditBackupService;
  csv: CsvDataService;
}

export class AppContainer {
  public db!: SQLiteDatabase;
  public repos!: AppRepositories;
  public services!: AppServices;
  public backupManager!: BackupManager;

  async init(customDbPath?: string): Promise<void> {
    const dbPath = customDbPath || path.resolve(process.cwd(), 'dairy_farm.sqlite');
    logger.info(`Initializing SQLite database from path: ${dbPath}`);
    this.db = new SQLiteDatabase(dbPath);
    await this.db.init();

    // Automated rolling snapshot on startup
    this.backupManager = new BackupManager(dbPath);
    this.backupManager.createSnapshot('startup');

    // Repositories initialization
    const animalRepo = new SQLiteAnimalRepository(this.db);
    const milkRepo = new SQLiteMilkRepository(this.db);
    const feedRepo = new SQLiteFeedRepository(this.db);
    const inventoryRepo = new SQLiteInventoryRepository(this.db);
    const healthRepo = new SQLiteHealthRepository(this.db);
    const vaccineRepo = new SQLiteVaccinationRepository(this.db);
    const breedingRepo = new SQLiteBreedingRepository(this.db);
    const growthRepo = new SQLiteGrowthRepository(this.db);
    const customerRepo = new SQLiteCustomerRepository(this.db);
    const deliveryRepo = new SQLiteDeliveryRepository(this.db);
    const paymentRepo = new SQLitePaymentRepository(this.db);
    const workerRepo = new SQLiteWorkerRepository(this.db);
    const expenseRepo = new SQLiteExpenseRepository(this.db);
    const reminderRepo = new SQLiteReminderRepository(this.db);
    const settingsRepo = new SQLiteSettingsRepository(this.db);
    const auditRepo = new SQLiteAuditRepository(this.db);
    const attachmentRepo = new SQLiteAttachmentRepository(this.db);

    this.repos = {
      animal: animalRepo,
      milk: milkRepo,
      feed: feedRepo,
      inventory: inventoryRepo,
      health: healthRepo,
      vaccine: vaccineRepo,
      breeding: breedingRepo,
      growth: growthRepo,
      customer: customerRepo,
      delivery: deliveryRepo,
      payment: paymentRepo,
      worker: workerRepo,
      expense: expenseRepo,
      reminder: reminderRepo,
      settings: settingsRepo,
      audit: auditRepo,
      attachment: attachmentRepo,
    };

    // Domain Services initialization
    const animalService = new AnimalService(animalRepo, auditRepo);
    const milkService = new MilkCalculationService(milkRepo, animalRepo, healthRepo, reminderRepo, auditRepo);
    const feedInventoryService = new FeedInventoryService(feedRepo, inventoryRepo, reminderRepo, auditRepo);
    const healthBreedingService = new HealthBreedingService(
      healthRepo,
      vaccineRepo,
      breedingRepo,
      growthRepo,
      animalRepo,
      reminderRepo,
      auditRepo,
      inventoryRepo,
      expenseRepo
    );
    const salesInvoiceService = new SalesInvoiceService(
      deliveryRepo,
      paymentRepo,
      customerRepo,
      workerRepo,
      expenseRepo,
      reminderRepo,
      auditRepo
    );
    const reminderService = new ReminderService(
      reminderRepo,
      milkRepo,
      inventoryRepo,
      deliveryRepo,
      vaccineRepo,
      breedingRepo,
      healthRepo,
      settingsRepo
    );
    const reportService = new ReportService(
      milkRepo,
      feedRepo,
      deliveryRepo,
      paymentRepo,
      expenseRepo,
      animalRepo
    );
    const auditBackupService = new AuditBackupService(
      animalRepo,
      milkRepo,
      feedRepo,
      inventoryRepo,
      healthRepo,
      vaccineRepo,
      breedingRepo,
      growthRepo,
      customerRepo,
      deliveryRepo,
      paymentRepo,
      workerRepo,
      expenseRepo,
      reminderRepo,
      settingsRepo,
      auditRepo
    );
    const csvService = new CsvDataService(this.db);

    this.services = {
      animal: animalService,
      milk: milkService,
      feedInventory: feedInventoryService,
      healthBreeding: healthBreedingService,
      salesInvoice: salesInvoiceService,
      reminder: reminderService,
      report: reportService,
      auditBackup: auditBackupService,
      csv: csvService,
    };

    // Run startup evaluation for automated reminders
    await reminderService.runStartupEvaluation();
  }
}

