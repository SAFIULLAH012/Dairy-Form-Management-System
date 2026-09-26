import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SQLiteDatabase } from './src/infrastructure/database/sqliteDb.ts';
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
} from './src/infrastructure/database/repositories.ts';
import { AnimalService } from './src/domain/services/AnimalService.ts';
import { MilkCalculationService } from './src/domain/services/MilkCalculationService.ts';
import { FeedInventoryService } from './src/domain/services/FeedInventoryService.ts';
import { HealthBreedingService } from './src/domain/services/HealthBreedingService.ts';
import { SalesInvoiceService } from './src/domain/services/SalesInvoiceService.ts';
import { ReminderService } from './src/domain/services/ReminderService.ts';
import { ReportService } from './src/domain/services/ReportService.ts';
import { AuditBackupService } from './src/domain/services/AuditBackupService.ts';
import { CsvDataService } from './src/domain/services/CsvDataService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite Database
  const db = new SQLiteDatabase();
  await db.init();
  console.log('✅ SQLite database initialized.');

  // Initialize Repositories
  const animalRepo = new SQLiteAnimalRepository(db);
  const milkRepo = new SQLiteMilkRepository(db);
  const feedRepo = new SQLiteFeedRepository(db);
  const inventoryRepo = new SQLiteInventoryRepository(db);
  const healthRepo = new SQLiteHealthRepository(db);
  const vaccineRepo = new SQLiteVaccinationRepository(db);
  const breedingRepo = new SQLiteBreedingRepository(db);
  const growthRepo = new SQLiteGrowthRepository(db);
  const customerRepo = new SQLiteCustomerRepository(db);
  const deliveryRepo = new SQLiteDeliveryRepository(db);
  const paymentRepo = new SQLitePaymentRepository(db);
  const workerRepo = new SQLiteWorkerRepository(db);
  const expenseRepo = new SQLiteExpenseRepository(db);
  const reminderRepo = new SQLiteReminderRepository(db);
  const settingsRepo = new SQLiteSettingsRepository(db);
  const auditRepo = new SQLiteAuditRepository(db);
  const attachmentRepo = new SQLiteAttachmentRepository(db);

  // Initialize Domain Services
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
    auditRepo
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
  const csvService = new CsvDataService(db);

  // Initial startup evaluation for overdue tasks & reminders
  await reminderService.runStartupEvaluation();

  // ================= API ROUTES =================

  // --- ANIMALS ---
  app.get('/api/animals', async (req: Request, res: Response) => {
    try {
      const sex = req.query.sex as 'Female' | 'Male' | undefined;
      const status = req.query.status as string | undefined;
      const group = req.query.group as string | undefined;
      const animals = await animalService.listAnimals({ sex, status, group });
      res.json(animals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/animals/:id', async (req: Request, res: Response) => {
    try {
      const animal = await animalService.getAnimal(req.params.id);
      if (!animal) return res.status(404).json({ error: 'Animal not found' });
      res.json(animal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/animals', async (req: Request, res: Response) => {
    try {
      const saved = await animalService.registerAnimal(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/animals/:id', async (req: Request, res: Response) => {
    try {
      const updated = await animalService.updateAnimal(req.params.id, req.body, req.body.reason);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/animals/:id/sold', async (req: Request, res: Response) => {
    try {
      const { saleDate, buyer, salePrice, notes } = req.body;
      const updated = await animalService.markSold(req.params.id, saleDate, buyer, salePrice, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/animals/:id/deceased', async (req: Request, res: Response) => {
    try {
      const { deathDate, deathReason, notes } = req.body;
      const updated = await animalService.markDeceased(req.params.id, deathDate, deathReason, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/animals/:id/timeline', async (req: Request, res: Response) => {
    try {
      const timeline = await animalService.getTimeline(req.params.id);
      res.json(timeline);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/animals/bulk/group', async (req: Request, res: Response) => {
    try {
      const { animalIds, newGroup, reason } = req.body;
      const updated = await animalService.bulkUpdateGroup(animalIds, newGroup, reason);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- MILK ---
  app.get('/api/milk/shifts', async (req: Request, res: Response) => {
    try {
      const shifts = await milkRepo.getShifts();
      res.json(shifts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/milk/total', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const totals = await milkRepo.listTotalEntries(fromDate, toDate);
      res.json(totals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/milk/total', async (req: Request, res: Response) => {
    try {
      const saved = await milkService.saveTotalMilk(req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/milk/unlock', async (req: Request, res: Response) => {
    try {
      const { date, shift, reason } = req.body;
      const unlocked = await milkService.unlockShift(date, shift, reason);
      res.json(unlocked);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/milk/individual', async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string;
      const shift = req.query.shift as string;
      if (!date || !shift) return res.status(400).json({ error: 'date and shift are required' });
      const entries = await milkRepo.listIndividualEntries(date, shift);
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/milk/individual', async (req: Request, res: Response) => {
    try {
      const { date, shift, entries } = req.body;
      const result = await milkService.saveIndividualShift({ date, shift, entries });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/milk/history/:animalId', async (req: Request, res: Response) => {
    try {
      const history = await milkRepo.listAnimalMilkHistory(req.params.animalId);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/milk/corrections', async (req: Request, res: Response) => {
    try {
      await milkRepo.recordCorrection(req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/milk/corrections', async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string | undefined;
      const shift = req.query.shift as string | undefined;
      const records = await milkRepo.listCorrections(date, shift);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- FEED & INVENTORY ---
  app.get('/api/feed/transactions', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const group = req.query.group as string | undefined;
      const txs = await feedRepo.listTransactions(fromDate, toDate, group);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/feed/transactions', async (req: Request, res: Response) => {
    try {
      const saved = await feedInventoryService.recordFeedConsumption(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/inventory/items', async (req: Request, res: Response) => {
    try {
      const items = await feedInventoryService.getInventoryStatus();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/inventory/transactions', async (req: Request, res: Response) => {
    try {
      const saved = await feedInventoryService.recordStockMovement(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/inventory/transactions', async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const txs = await inventoryRepo.listTransactions(itemId);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- HEALTH & VACCINATION ---
  app.get('/api/health/cases', async (req: Request, res: Response) => {
    try {
      const animalId = req.query.animalId as string | undefined;
      const status = req.query.status as string | undefined;
      const cases = await healthRepo.listCases({ animalId, status });
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/health/cases', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordHealthCase(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/health/cases/:id', async (req: Request, res: Response) => {
    try {
      const updated = await healthBreedingService.updateHealthCase(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/vaccinations', async (req: Request, res: Response) => {
    try {
      const animalId = req.query.animalId as string | undefined;
      const list = await vaccineRepo.listRecords({ animalId });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/vaccinations', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordVaccination(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- BREEDING & CALVING ---
  app.get('/api/breeding/records', async (req: Request, res: Response) => {
    try {
      const animalId = req.query.animalId as string | undefined;
      const records = await breedingRepo.listRecords(animalId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/breeding/records', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordBreedingEvent(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/breeding/calving', async (req: Request, res: Response) => {
    try {
      await healthBreedingService.recordCalvingWorkflow(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/growth/:animalId', async (req: Request, res: Response) => {
    try {
      const records = await growthRepo.listByAnimal(req.params.animalId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/growth/:animalId', async (req: Request, res: Response) => {
    try {
      const saved = await healthBreedingService.recordGrowthMeasurement({
        animalId: req.params.animalId,
        date: req.body.date,
        weightKg: req.body.weightKg,
        notes: req.body.notes,
      });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CUSTOMERS, DELIVERIES & INVOICES ---
  app.get('/api/customers', async (req: Request, res: Response) => {
    try {
      const list = await customerRepo.listAll();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers', async (req: Request, res: Response) => {
    try {
      const customer = {
        ...req.body,
        id: req.body.id || `CUST_${Date.now()}`,
        createdAt: req.body.createdAt || new Date().toISOString(),
      };
      const saved = await customerRepo.save(customer);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/deliveries', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const customerId = req.query.customerId as string | undefined;
      const list = await deliveryRepo.listInvoices({ fromDate, toDate, customerId });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/deliveries', async (req: Request, res: Response) => {
    try {
      const invoice = await salesInvoiceService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/deliveries/:id/pay', async (req: Request, res: Response) => {
    try {
      const payment = await salesInvoiceService.recordPayment({
        invoiceId: req.params.id,
        ...req.body,
      });
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/payments', async (req: Request, res: Response) => {
    try {
      const list = await paymentRepo.listAll();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- WORKERS & EXPENSES ---
  app.get('/api/workers', async (req: Request, res: Response) => {
    try {
      const list = await workerRepo.listWorkers();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workers', async (req: Request, res: Response) => {
    try {
      const worker = {
        ...req.body,
        id: req.body.id || `WRK_${Date.now()}`,
        createdAt: req.body.createdAt || new Date().toISOString(),
      };
      const saved = await workerRepo.saveWorker(worker);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/workers/:id/ledger', async (req: Request, res: Response) => {
    try {
      const ledger = await salesInvoiceService.getWorkerLedger(req.params.id);
      res.json(ledger);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workers/:id/transactions', async (req: Request, res: Response) => {
    try {
      const tx = await salesInvoiceService.recordWorkerTransaction({
        workerId: req.params.id,
        ...req.body,
      });
      res.status(201).json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/expenses', async (req: Request, res: Response) => {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const category = req.query.category as string | undefined;
      const list = await expenseRepo.listExpenses({ fromDate, toDate, category });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/expenses', async (req: Request, res: Response) => {
    try {
      const saved = await salesInvoiceService.recordExpense(req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- REMINDERS & NOTIFICATIONS ---
  app.get('/api/reminders', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const tasks = await reminderRepo.listTasks(status);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reminders', async (req: Request, res: Response) => {
    try {
      const task = {
        ...req.body,
        id: req.body.id || `TASK_${Date.now()}`,
        status: req.body.status || 'Due',
        createdAt: new Date().toISOString(),
      };
      const saved = await reminderRepo.saveTask(task);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/reminders/:id/complete', async (req: Request, res: Response) => {
    try {
      await reminderRepo.completeTask(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/reminders/:id', async (req: Request, res: Response) => {
    try {
      await reminderRepo.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/reminders/notifications', async (req: Request, res: Response) => {
    try {
      const summary = await reminderService.getNotificationCenterSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- REPORTS ---
  app.get('/api/reports/financial', async (req: Request, res: Response) => {
    try {
      const fromDate = (req.query.fromDate as string) || new Date().toISOString().slice(0, 7) + '-01';
      const toDate = (req.query.toDate as string) || new Date().toISOString().slice(0, 10);
      const report = await reportService.generateFinancialReport(fromDate, toDate);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/herd', async (req: Request, res: Response) => {
    try {
      const stats = await reportService.getHerdStatistics();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SETTINGS, AUDIT, HEALTH, BACKUP ---
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await settingsRepo.getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings', async (req: Request, res: Response) => {
    try {
      const saved = await settingsRepo.saveSettings({
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/settings/groups', async (req: Request, res: Response) => {
    try {
      const groups = await settingsRepo.getGroups();
      res.json(groups);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/groups', async (req: Request, res: Response) => {
    try {
      const { groups } = req.body;
      await settingsRepo.saveGroups(groups);
      res.json({ success: true, groups });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/settings/health', async (req: Request, res: Response) => {
    try {
      const health = await auditBackupService.getDatabaseHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/audit', async (req: Request, res: Response) => {
    try {
      const logs = await auditRepo.listLogs(100);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/backup/export', async (req: Request, res: Response) => {
    try {
      const backup = await auditBackupService.generateFullBackup();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dairy_farm_backup_${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.send(JSON.stringify(backup, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/backup/validate', (req: Request, res: Response) => {
    try {
      const validation = auditBackupService.validateBackupFile(req.body);
      res.json(validation);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CSV IMPORT / EXPORT ---
  app.post('/api/csv/preview', (req: Request, res: Response) => {
    try {
      const { module, text } = req.body;
      if (module === 'ANIMALS') return res.json(csvService.previewAnimalsCsv(text));
      if (module === 'MILK') return res.json(csvService.previewMilkCsv(text));
      return res.json(csvService.previewCustomersCsv(text));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/csv/import', (req: Request, res: Response) => {
    try {
      const { preview, user } = req.body;
      const result = csvService.executeImport(preview, user);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/csv/export/:module', (req: Request, res: Response) => {
    try {
      const { module } = req.params;
      let csv = '';
      if (module === 'animals') csv = csvService.exportAnimalsCsv();
      else if (module === 'milk') csv = csvService.exportMilkCsv();
      else return res.status(400).json({ error: 'Unknown export module' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${module}_export.csv"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ATTACHMENTS ---
  app.post('/api/attachments', async (req: Request, res: Response) => {
    try {
      const meta = await attachmentRepo.saveMetadata(req.body);
      res.json(meta);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/attachments/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
      const files = await attachmentRepo.getMetadata(req.params.entityType, req.params.entityId);
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/attachments/:id', async (req: Request, res: Response) => {
    try {
      await attachmentRepo.deleteMetadata(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Mount Vite development middlewares in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve production build files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dairy Farm ERP backend running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
