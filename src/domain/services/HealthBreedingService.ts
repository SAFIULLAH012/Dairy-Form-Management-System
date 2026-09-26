import {
  HealthCase,
  VaccinationRecord,
  BreedingRecord,
  GrowthMeasurement,
} from '../types.ts';
import {
  IHealthRepository,
  IVaccinationRepository,
  IBreedingRepository,
  IGrowthRepository,
  IAnimalRepository,
  IReminderRepository,
  IAuditRepository,
} from '../repositories.ts';
import { calculateBreedingPredictions, addDays } from '../calculations.ts';

export class HealthBreedingService {
  constructor(
    private healthRepo: IHealthRepository,
    private vaccineRepo: IVaccinationRepository,
    private breedingRepo: IBreedingRepository,
    private growthRepo: IGrowthRepository,
    private animalRepo: IAnimalRepository,
    private reminderRepo: IReminderRepository,
    private auditRepo: IAuditRepository
  ) {}

  // ================= HEALTH =================
  async recordHealthCase(data: Omit<HealthCase, 'id' | 'createdAt' | 'updatedAt'>, user: string = 'Operator'): Promise<HealthCase> {
    const now = new Date().toISOString();
    const healthCase: HealthCase = {
      ...data,
      id: `HEALTH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.healthRepo.createCase(healthCase);

    if (saved.followUpDate && saved.status !== 'Closed' && saved.status !== 'Recovered') {
      await this.reminderRepo.saveTask({
        id: `TASK_HEALTH_${saved.id}`,
        title: `Health Follow-up: ${saved.animalId} (${saved.problem})`,
        sourceModule: 'health',
        dueDate: saved.followUpDate,
        dueTime: '09:00',
        status: 'Scheduled',
        linkedRecordId: saved.id,
        createdAt: now,
      });
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'HEALTH',
      recordId: saved.id,
      newValues: saved,
      user,
    });

    return saved;
  }

  async updateHealthCase(id: string, updates: Partial<HealthCase>, user: string = 'Operator'): Promise<HealthCase> {
    const current = await this.healthRepo.findCaseById(id);
    if (!current) throw new Error(`Health case ${id} not found.`);

    const now = new Date().toISOString();
    const updated: HealthCase = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    const saved = await this.healthRepo.updateCase(updated);

    if (updates.status === 'Closed' || updates.status === 'Recovered') {
      // Clear associated task
      const task = await this.reminderRepo.findTaskByAutoKey(`TASK_HEALTH_${id}`);
      if (task) {
        await this.reminderRepo.completeTask(task.id);
      }
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'UPDATE',
      module: 'HEALTH',
      recordId: id,
      oldValues: current,
      newValues: updated,
      user,
    });

    return saved;
  }

  // ================= VACCINATION =================
  async recordVaccination(data: Omit<VaccinationRecord, 'id' | 'createdAt' | 'status'>, user: string = 'Operator'): Promise<VaccinationRecord> {
    const today = new Date().toISOString().slice(0, 10);
    const isDue = data.nextDueDate <= today;
    const now = new Date().toISOString();

    const record: VaccinationRecord = {
      ...data,
      id: `VAC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: isDue ? 'Due Today' : 'Completed',
      createdAt: now,
    };

    const saved = await this.vaccineRepo.createRecord(record);

    if (saved.nextDueDate) {
      await this.reminderRepo.saveTask({
        id: `TASK_VAC_${saved.id}`,
        title: `Vaccination Due: ${saved.vaccineType} for ${saved.animalId}`,
        sourceModule: 'vaccination',
        dueDate: saved.nextDueDate,
        dueTime: '08:30',
        status: 'Scheduled',
        linkedRecordId: saved.id,
        createdAt: now,
      });
    }

    return saved;
  }

  // ================= BREEDING =================
  async recordBreedingEvent(
    data: Omit<
      BreedingRecord,
      'id' | 'createdAt' | 'expectedCalvingDate' | 'recommendedDryOffDate' | 'expectedNextHeatDate'
    >,
    user: string = 'Operator'
  ): Promise<BreedingRecord> {
    const predictions = calculateBreedingPredictions({
      inseminationDate: data.event === 'Insemination' ? data.date : undefined,
      lastHeatDate: data.event === 'Heat' ? data.date : undefined,
      isPregnant: data.event === 'Pregnant',
    });

    const now = new Date().toISOString();
    const record: BreedingRecord = {
      ...data,
      id: `BREED_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      expectedCalvingDate: predictions.expectedCalvingDate,
      recommendedDryOffDate: predictions.recommendedDryOffDate,
      expectedNextHeatDate: predictions.expectedNextHeatDate,
      createdAt: now,
    };

    const saved = await this.breedingRepo.createRecord(record);

    // Update Animal reproductive status if applicable
    if (data.event === 'Pregnant') {
      await this.animalRepo.update({
        ...(await this.animalRepo.findById(data.animalId))!,
        reproStatus: 'Pregnant',
        updatedAt: now,
      });
    } else if (data.event === 'Repeat') {
      await this.animalRepo.update({
        ...(await this.animalRepo.findById(data.animalId))!,
        reproStatus: 'Repeat',
        updatedAt: now,
      });
    } else if (data.event === 'Nil') {
      await this.animalRepo.update({
        ...(await this.animalRepo.findById(data.animalId))!,
        reproStatus: 'Nil',
        updatedAt: now,
      });
    }

    // Schedule reminders for biological predictions
    if (predictions.expectedCalvingDate) {
      await this.reminderRepo.saveTask({
        id: `TASK_CALV_${saved.id}`,
        title: `Expected Calving: Cow ${data.animalId}`,
        sourceModule: 'breeding',
        dueDate: predictions.expectedCalvingDate,
        dueTime: '08:00',
        status: 'Scheduled',
        linkedRecordId: saved.id,
        createdAt: now,
      });
    }

    if (predictions.recommendedDryOffDate) {
      await this.reminderRepo.saveTask({
        id: `TASK_DRY_${saved.id}`,
        title: `Recommended Dry-off: Cow ${data.animalId}`,
        sourceModule: 'breeding',
        dueDate: predictions.recommendedDryOffDate,
        dueTime: '08:00',
        status: 'Scheduled',
        linkedRecordId: saved.id,
        createdAt: now,
      });
    }

    if (predictions.expectedNextHeatDate) {
      await this.reminderRepo.saveTask({
        id: `TASK_HEAT_${saved.id}`,
        title: `Expected Next Heat (if not settled): Cow ${data.animalId}`,
        sourceModule: 'breeding',
        dueDate: predictions.expectedNextHeatDate,
        dueTime: '08:00',
        status: 'Scheduled',
        linkedRecordId: saved.id,
        createdAt: now,
      });
    }

    return saved;
  }

  // ================= CALVING & GROWTH =================
  async recordCalvingWorkflow(params: {
    damId: string;
    calvingDate: string;
    calfSex: 'Female' | 'Male';
    calfId: string;
    calfBreed: string;
    birthWeight?: number;
    sireId?: string;
    notes?: string;
    user?: string;
  }) {
    const user = params.user || 'Operator';
    const now = new Date().toISOString();

    // 1. Record actual calving in breeding repository
    await this.recordBreedingEvent(
      {
        animalId: params.damId,
        date: params.calvingDate,
        event: 'Calving',
        actualCalvingDate: params.calvingDate,
        status: 'Completed',
        notes: `Calved ${params.calfSex} calf ${params.calfId}. Weight: ${params.birthWeight ?? 'N/A'} kg`,
      },
      user
    );

    // 2. Update Dam (Mother) to Adult, Milking
    const dam = await this.animalRepo.findById(params.damId);
    if (dam) {
      await this.animalRepo.update({
        ...dam,
        stage: 'Adult',
        reproStatus: 'Milking',
        milkStatus: 'Milking',
        updatedAt: now,
      });
    }

    // 3. Register Calf
    await this.animalRepo.create({
      id: params.calfId,
      sex: params.calfSex,
      dob: params.calvingDate,
      breed: params.calfBreed,
      group: 'Low', // Calves start in low or starter group
      stage: params.calfSex === 'Male' ? 'Male' : 'Calf',
      reproStatus: params.calfSex === 'Male' ? 'N/A' : 'Pending',
      milkStatus: params.calfSex === 'Male' ? 'N/A' : 'Not Milking',
      status: 'Active',
      damId: params.damId,
      sireId: params.sireId,
      birthWeight: params.birthWeight,
      notes: params.notes || `Born from dam ${params.damId}`,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Initial Growth measurement if birth weight was entered
    if (params.birthWeight && params.birthWeight > 0) {
      await this.growthRepo.createMeasurement({
        id: `GROWTH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        animalId: params.calfId,
        date: params.calvingDate,
        weightKg: params.birthWeight,
        ageDaysAtWeighing: 0,
        notes: 'Birth Weight',
        createdAt: now,
      });
    }
  }

  async recordGrowthMeasurement(params: {
    animalId: string;
    date: string;
    weightKg: number;
    notes?: string;
  }): Promise<GrowthMeasurement> {
    const animal = await this.animalRepo.findById(params.animalId);
    if (!animal) throw new Error(`Animal ${params.animalId} not found.`);

    // Age in days at weighing
    const dob = new Date(animal.dob + 'T00:00:00');
    const weighDate = new Date(params.date + 'T00:00:00');
    const ageDays = Math.max(0, Math.floor((weighDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)));

    // Previous measurements to calculate ADG (Average Daily Gain)
    const existing = await this.growthRepo.listByAnimal(params.animalId);
    let adg: number | undefined;

    if (existing.length > 0) {
      const prev = existing[existing.length - 1];
      const prevDate = new Date(prev.date + 'T00:00:00');
      const daysDiff = (weighDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 0) {
        adg = Number(((params.weightKg - prev.weightKg) / daysDiff).toFixed(3));
      }
    }

    const measurement: GrowthMeasurement = {
      id: `GROWTH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      animalId: params.animalId,
      date: params.date,
      weightKg: Number(params.weightKg),
      ageDaysAtWeighing: ageDays,
      averageDailyGain: adg,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    return this.growthRepo.createMeasurement(measurement);
  }
}
