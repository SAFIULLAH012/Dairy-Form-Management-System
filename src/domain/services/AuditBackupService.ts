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
} from '../repositories.ts';

export interface BackupPayload {
  formatVersion: '1.0';
  exportedAt: string;
  appVersion: string;
  data: {
    animals: any[];
    statusHistory: any[];
    groups: string[];
    shifts: any[];
    milkTotals: any[];
    milkIndividuals: any[];
    feedTransactions: any[];
    inventoryItems: any[];
    inventoryTransactions: any[];
    healthCases: any[];
    vaccinations: any[];
    breedingRecords: any[];
    growthMeasurements: any[];
    customers: any[];
    invoices: any[];
    payments: any[];
    workers: any[];
    workerTransactions: any[];
    expenses: any[];
    reminders: any[];
    settings: any;
    auditLogs: any[];
  };
}

export class AuditBackupService {
  constructor(
    private animalRepo: IAnimalRepository,
    private milkRepo: IMilkRepository,
    private feedRepo: IFeedRepository,
    private inventoryRepo: IInventoryRepository,
    private healthRepo: IHealthRepository,
    private vaccineRepo: IVaccinationRepository,
    private breedingRepo: IBreedingRepository,
    private growthRepo: IGrowthRepository,
    private customerRepo: ICustomerRepository,
    private deliveryRepo: IDeliveryRepository,
    private paymentRepo: IPaymentRepository,
    private workerRepo: IWorkerRepository,
    private expenseRepo: IExpenseRepository,
    private reminderRepo: IReminderRepository,
    private settingsRepo: ISettingsRepository,
    private auditRepo: IAuditRepository
  ) {}

  async generateFullBackup(): Promise<BackupPayload> {
    const animals = await this.animalRepo.listAll();
    const groups = await this.settingsRepo.getGroups();
    const settings = await this.settingsRepo.getSettings();
    const shifts = await this.milkRepo.getShifts();
    const milkTotals = await this.milkRepo.listTotalEntries();
    const feedTxs = await this.feedRepo.listTransactions();
    const invItems = await this.inventoryRepo.listItems();
    const invTxs = await this.inventoryRepo.listTransactions();
    const healthCases = await this.healthRepo.listCases();
    const vaccinations = await this.vaccineRepo.listRecords();
    const breeding = await this.breedingRepo.listRecords();
    const customers = await this.customerRepo.listAll();
    const invoices = await this.deliveryRepo.listInvoices();
    const payments = await this.paymentRepo.listAll();
    const workers = await this.workerRepo.listWorkers();
    const workerTxs = await this.workerRepo.listTransactions();
    const expenses = await this.expenseRepo.listExpenses();
    const reminders = await this.reminderRepo.listTasks();
    const auditLogs = await this.auditRepo.listLogs(500);

    return {
      formatVersion: '1.0',
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      data: {
        animals,
        statusHistory: [],
        groups,
        shifts,
        milkTotals,
        milkIndividuals: [],
        feedTransactions: feedTxs,
        inventoryItems: invItems,
        inventoryTransactions: invTxs,
        healthCases,
        vaccinations,
        breedingRecords: breeding,
        growthMeasurements: [],
        customers,
        invoices,
        payments,
        workers,
        workerTransactions: workerTxs,
        expenses,
        reminders,
        settings,
        auditLogs,
      },
    };
  }

  validateBackupFile(content: any): {
    isValid: boolean;
    errors: string[];
    counts: Record<string, number>;
  } {
    const errors: string[] = [];
    const counts: Record<string, number> = {};

    if (!content || typeof content !== 'object') {
      return { isValid: false, errors: ['Invalid backup: Not a valid JSON object.'], counts: {} };
    }

    if (content.formatVersion !== '1.0') {
      errors.push(`Unsupported backup format version: ${content.formatVersion}. Expected '1.0'.`);
    }

    if (!content.data || typeof content.data !== 'object') {
      errors.push('Backup payload is missing root "data" dictionary.');
      return { isValid: false, errors, counts: {} };
    }

    const expectedKeys = [
      'animals',
      'milkTotals',
      'feedTransactions',
      'inventoryItems',
      'customers',
      'invoices',
      'expenses',
    ];

    for (const key of expectedKeys) {
      if (!Array.isArray(content.data[key])) {
        errors.push(`Missing or corrupt table array: data.${key}`);
      } else {
        counts[key] = content.data[key].length;
      }
    }

    counts.groups = Array.isArray(content.data.groups) ? content.data.groups.length : 0;
    counts.healthCases = Array.isArray(content.data.healthCases) ? content.data.healthCases.length : 0;
    counts.vaccinations = Array.isArray(content.data.vaccinations) ? content.data.vaccinations.length : 0;
    counts.breedingRecords = Array.isArray(content.data.breedingRecords) ? content.data.breedingRecords.length : 0;
    counts.workers = Array.isArray(content.data.workers) ? content.data.workers.length : 0;

    return {
      isValid: errors.length === 0,
      errors,
      counts,
    };
  }

  async restoreFromBackup(payload: any): Promise<{ success: boolean; restoredCounts: Record<string, number> }> {
    const validation = this.validateBackupFile(payload);
    if (!validation.isValid) {
      throw new Error(`Backup validation failed: ${validation.errors.join('; ')}`);
    }

    const { data } = payload;
    if (Array.isArray(data.animals)) {
      for (const item of data.animals) {
        const existing = await this.animalRepo.findById(item.id);
        if (existing) await this.animalRepo.update(item);
        else await this.animalRepo.create(item);
      }
    }
    if (Array.isArray(data.milkTotals)) {
      for (const item of data.milkTotals) {
        await this.milkRepo.saveTotalEntry(item);
      }
    }
    if (Array.isArray(data.feedTransactions)) {
      for (const item of data.feedTransactions) {
        await this.feedRepo.createTransaction(item);
      }
    }
    if (Array.isArray(data.inventoryItems)) {
      for (const item of data.inventoryItems) {
        await this.inventoryRepo.saveItem(item);
      }
    }
    if (Array.isArray(data.healthCases)) {
      for (const item of data.healthCases) {
        const existing = await this.healthRepo.findCaseById(item.id);
        if (existing) await this.healthRepo.updateCase(item);
        else await this.healthRepo.createCase(item);
      }
    }
    if (Array.isArray(data.vaccinations)) {
      for (const item of data.vaccinations) {
        await this.vaccineRepo.createRecord(item);
      }
    }
    if (Array.isArray(data.breedingRecords)) {
      for (const item of data.breedingRecords) {
        await this.breedingRepo.createRecord(item);
      }
    }
    if (Array.isArray(data.customers)) {
      for (const item of data.customers) {
        await this.customerRepo.save(item);
      }
    }
    if (Array.isArray(data.invoices)) {
      for (const item of data.invoices) {
        await this.deliveryRepo.saveInvoice(item);
      }
    }
    if (Array.isArray(data.payments)) {
      for (const item of data.payments) {
        await this.paymentRepo.createPayment(item);
      }
    }
    if (Array.isArray(data.workers)) {
      for (const item of data.workers) {
        await this.workerRepo.saveWorker(item);
      }
    }
    if (Array.isArray(data.expenses)) {
      for (const item of data.expenses) {
        await this.expenseRepo.createExpense(item);
      }
    }
    if (Array.isArray(data.groups)) {
      await this.settingsRepo.saveGroups(data.groups);
    }
    if (data.settings) {
      await this.settingsRepo.saveSettings(data.settings);
    }

    return { success: true, restoredCounts: validation.counts };
  }

  async getDatabaseHealth() {
    const animals = await this.animalRepo.listAll();
    const milk = await this.milkRepo.listTotalEntries();
    const feed = await this.feedRepo.listTransactions();
    const inv = await this.inventoryRepo.listItems();
    const health = await this.healthRepo.listCases();
    const breeding = await this.breedingRepo.listRecords();
    const invoices = await this.deliveryRepo.listInvoices();
    const payments = await this.paymentRepo.listAll();
    const expenses = await this.expenseRepo.listExpenses();
    const audits = await this.auditRepo.listLogs(10);

    // Integrity check: look for orphan records
    const animalIdSet = new Set(animals.map(a => a.id));
    const orphanHealth = health.filter(h => !animalIdSet.has(h.animalId));
    const orphanBreeding = breeding.filter(b => !animalIdSet.has(b.animalId));

    return {
      recordCounts: {
        animals: animals.length,
        milkShifts: milk.length,
        feedLogs: feed.length,
        inventoryItems: inv.length,
        healthCases: health.length,
        breedingRecords: breeding.length,
        invoices: invoices.length,
        payments: payments.length,
        expenses: expenses.length,
      },
      integrity: {
        orphanHealthCases: orphanHealth.length,
        orphanBreedingRecords: orphanBreeding.length,
        status: orphanHealth.length === 0 && orphanBreeding.length === 0 ? 'HEALTHY' : 'WARNING',
      },
      lastOperationTimestamp: audits.length > 0 ? audits[0].timestamp : 'N/A',
    };
  }
}
