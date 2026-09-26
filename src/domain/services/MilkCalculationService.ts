import {
  MilkTotalEntry,
  MilkIndividualEntry,
  HealthCase,
  FarmTaskReminder,
} from '../types.ts';
import {
  IMilkRepository,
  IAnimalRepository,
  IHealthRepository,
  IReminderRepository,
  IAuditRepository,
} from '../repositories.ts';
import { calculateMilkWeighted, addDays } from '../calculations.ts';

export class MilkCalculationService {
  constructor(
    private milkRepo: IMilkRepository,
    private animalRepo: IAnimalRepository,
    private healthRepo: IHealthRepository,
    private reminderRepo: IReminderRepository,
    private auditRepo: IAuditRepository
  ) {}

  async saveTotalMilk(
    entry: Omit<MilkTotalEntry, 'id' | 'createdAt' | 'updatedAt' | 'mode'>,
    user: string = 'Operator'
  ): Promise<MilkTotalEntry> {
    const existing = await this.milkRepo.findTotalEntry(entry.date, entry.shift);
    const now = new Date().toISOString();

    if (existing && existing.locked) {
      throw new Error(`Shift ${entry.shift} on ${entry.date} is locked. Corrections require unlocked status.`);
    }

    const record: MilkTotalEntry = {
      id: existing ? existing.id : `MILK_TOT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: entry.date,
      shift: entry.shift,
      totalLitres: Number(entry.totalLitres),
      fatPercent: entry.fatPercent != null ? Number(entry.fatPercent) : undefined,
      snfPercent: entry.snfPercent != null ? Number(entry.snfPercent) : undefined,
      mode: 'total',
      locked: false,
      notes: entry.notes,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    const saved = await this.milkRepo.saveTotalEntry(record);

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: existing ? 'UPDATE' : 'CREATE',
      module: 'MILK_TOTAL',
      recordId: saved.id,
      oldValues: existing,
      newValues: saved,
      user,
    });

    // Mark daily milk task as completed
    const taskKey = `DAILY_MILK_${entry.date}_${entry.shift}`;
    const task = await this.reminderRepo.findTaskByAutoKey(taskKey);
    if (task) {
      await this.reminderRepo.completeTask(task.id);
    }

    return saved;
  }

  async saveIndividualShift(params: {
    date: string;
    shift: string;
    entries: Array<{
      animalId: string;
      litres: number;
      fatPercent?: number;
      snfPercent?: number;
      reason: MilkIndividualEntry['reason'];
      notes?: string;
    }>;
    user?: string;
  }) {
    const user = params.user || 'Operator';
    const now = new Date().toISOString();
    const existingTotal = await this.milkRepo.findTotalEntry(params.date, params.shift);

    if (existingTotal && existingTotal.locked) {
      throw new Error(`Shift ${params.shift} on ${params.date} is locked.`);
    }

    const activeFemales = await this.animalRepo.listAll({ sex: 'Female', status: 'Active' });
    const activeFemaleIds = new Set(activeFemales.map(a => a.id));

    // Verify all active cows are accounted for
    const accountedIds = new Set(params.entries.map(e => e.animalId));
    const missingCows = activeFemales.filter(a => !accountedIds.has(a.id));

    if (missingCows.length > 0) {
      throw new Error(
        `Cannot complete shift: ${missingCows.length} cows are still unaccounted for (${missingCows
          .slice(0, 5)
          .map(c => c.id)
          .join(', ')}${missingCows.length > 5 ? '...' : ''}). Every cow must have litres or a designated reason.`
      );
    }

    // Calculate metrics
    const metrics = calculateMilkWeighted(params.entries, activeFemales.length);

    // Prepare individual records
    const indRecords: MilkIndividualEntry[] = params.entries.map(e => ({
      id: `MILK_IND_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      date: params.date,
      shift: params.shift,
      animalId: e.animalId,
      litres: Number(e.litres || 0),
      fatPercent: e.fatPercent != null ? Number(e.fatPercent) : undefined,
      snfPercent: e.snfPercent != null ? Number(e.snfPercent) : undefined,
      reason: e.reason,
      notes: e.notes,
      createdAt: now,
      updatedAt: now,
    }));

    await this.milkRepo.saveIndividualEntries(params.date, params.shift, indRecords);

    // Save corresponding total entry with weighted metrics
    const totalRecord: MilkTotalEntry = {
      id: existingTotal ? existingTotal.id : `MILK_TOT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: params.date,
      shift: params.shift,
      totalLitres: metrics.totalLitres,
      fatPercent: metrics.weightedFat ?? undefined,
      snfPercent: metrics.weightedSnf ?? undefined,
      mode: 'individual',
      locked: true, // Lock upon shift completion
      notes: `Individual shift completed with ${params.entries.length} cows (${metrics.sickCount} sick).`,
      createdAt: existingTotal ? existingTotal.createdAt : now,
      updatedAt: now,
    };

    const savedTotal = await this.milkRepo.saveTotalEntry(totalRecord);

    // Automate sick cow health cases without duplicate spamming
    for (const e of params.entries) {
      if (e.reason === 'Sick') {
        const existingCases = await this.healthRepo.listCases({
          animalId: e.animalId,
          fromDate: params.date,
          toDate: params.date,
        });

        const alreadyReported = existingCases.some(c => c.source === 'MILK_ENTRY');
        if (!alreadyReported) {
          const followUpDate = addDays(params.date, 1);
          await this.healthRepo.createCase({
            id: `HEALTH_AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            animalId: e.animalId,
            date: params.date,
            problem: e.notes || 'Reported sick during milk collection',
            symptoms: 'Identified during milking shift',
            status: 'Open',
            followUpDate,
            source: 'MILK_ENTRY',
            notes: `Auto-generated from ${params.shift} milk entry on ${params.date}`,
            createdAt: now,
            updatedAt: now,
          });

          await this.reminderRepo.saveTask({
            id: `TASK_HEALTH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            title: `Health follow-up: Sick Cow ${e.animalId}`,
            sourceModule: 'health',
            dueDate: followUpDate,
            dueTime: '09:00',
            status: 'Due',
            linkedRecordId: e.animalId,
            createdAt: now,
          });
        }
      }
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'MILK_INDIVIDUAL',
      recordId: `${params.date}_${params.shift}`,
      newValues: { totalLitres: metrics.totalLitres, count: params.entries.length },
      user,
    });

    return { total: savedTotal, metrics };
  }

  async unlockShift(date: string, shift: string, reason: string, user: string = 'Supervisor') {
    const entry = await this.milkRepo.findTotalEntry(date, shift);
    if (!entry) {
      throw new Error(`Shift ${shift} on ${date} not found.`);
    }

    const updated = await this.milkRepo.saveTotalEntry({
      ...entry,
      locked: false,
      updatedAt: new Date().toISOString(),
    });

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'CORRECTION',
      module: 'MILK_SHIFT',
      recordId: entry.id,
      oldValues: { locked: true },
      newValues: { locked: false },
      reason,
      user,
    });

    return updated;
  }
}
