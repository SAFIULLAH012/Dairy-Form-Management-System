import { Animal, AnimalRecordStatus, StatusHistory } from '../types.ts';
import { IAnimalRepository, IAuditRepository, IReminderRepository, IHealthRepository } from '../repositories.ts';
import { calculateAge } from '../calculations.ts';

export class AnimalService {
  constructor(
    private animalRepo: IAnimalRepository,
    private auditRepo: IAuditRepository,
    private reminderRepo?: IReminderRepository,
    private healthRepo?: IHealthRepository
  ) {}

  async getAnimal(idOrIdentifier: string): Promise<(Animal & { calculatedAge: string }) | null> {
    let animal = await this.animalRepo.findById(idOrIdentifier);
    if (!animal) {
      animal = await this.animalRepo.findByIdentifier(idOrIdentifier);
    }
    if (!animal) return null;

    const age = calculateAge(animal.dob);
    return {
      ...animal,
      calculatedAge: age.display,
    };
  }

  async listAnimals(filters?: { sex?: 'Female' | 'Male'; status?: string; group?: string }) {
    const list = await this.animalRepo.listAll(filters);
    return list.map(a => ({
      ...a,
      calculatedAge: calculateAge(a.dob).display,
    }));
  }

  async registerAnimal(data: Omit<Animal, 'createdAt' | 'updatedAt'>, user: string = 'Operator'): Promise<Animal> {
    const existing = await this.animalRepo.findById(data.id);
    if (existing) {
      throw new Error(`Animal with ID '${data.id}' already exists.`);
    }

    const now = new Date().toISOString();
    const animal: Animal = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.animalRepo.create(animal);

    // Register primary identifiers
    await this.animalRepo.addIdentifier({
      id: `${animal.id}_PRIMARY`,
      animalId: animal.id,
      type: 'COW_NUMBER',
      value: animal.id,
    });

    if (animal.tag1) {
      await this.animalRepo.addIdentifier({
        id: `${animal.id}_TAG1`,
        animalId: animal.id,
        type: 'TAG_1',
        value: animal.tag1,
      });
    }

    if (animal.tag2) {
      await this.animalRepo.addIdentifier({
        id: `${animal.id}_TAG2`,
        animalId: animal.id,
        type: 'TAG_2',
        value: animal.tag2,
      });
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'ANIMAL',
      recordId: animal.id,
      newValues: animal,
      user,
    });

    return saved;
  }

  async updateAnimal(
    id: string,
    updates: Partial<Animal>,
    reason?: string,
    user: string = 'Operator'
  ): Promise<Animal> {
    const current = await this.animalRepo.findById(id);
    if (!current) {
      throw new Error(`Animal ${id} not found.`);
    }

    const now = new Date().toISOString();
    const updated: Animal = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    // Track status and group changes in history
    if (updates.status && updates.status !== current.status) {
      await this.animalRepo.addStatusHistory({
        id: `HIST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        animalId: id,
        changeType: 'STATUS',
        oldValue: current.status,
        newValue: updates.status,
        date: now.slice(0, 10),
        reason,
        user,
        createdAt: now,
      });
    }

    if (updates.group && updates.group !== current.group) {
      await this.animalRepo.addStatusHistory({
        id: `HIST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        animalId: id,
        changeType: 'GROUP',
        oldValue: current.group,
        newValue: updates.group,
        date: now.slice(0, 10),
        reason,
        user,
        createdAt: now,
      });
    }

    if (updates.reproStatus && updates.reproStatus !== current.reproStatus) {
      await this.animalRepo.addStatusHistory({
        id: `HIST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        animalId: id,
        changeType: 'REPRODUCTIVE',
        oldValue: current.reproStatus,
        newValue: updates.reproStatus,
        date: now.slice(0, 10),
        reason,
        user,
        createdAt: now,
      });
    }

    if (updates.milkStatus && updates.milkStatus !== current.milkStatus) {
      await this.animalRepo.addStatusHistory({
        id: `HIST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        animalId: id,
        changeType: 'MILK',
        oldValue: current.milkStatus,
        newValue: updates.milkStatus,
        date: now.slice(0, 10),
        reason,
        user,
        createdAt: now,
      });
    }

    const saved = await this.animalRepo.update(updated);

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'UPDATE',
      module: 'ANIMAL',
      recordId: id,
      oldValues: current,
      newValues: updated,
      reason,
      user,
    });

    return saved;
  }

  async markSold(
    id: string,
    saleDate: string,
    buyer: string,
    salePrice: number,
    notes?: string,
    user: string = 'Operator'
  ) {
    const updated = await this.updateAnimal(
      id,
      {
        status: 'Sold',
        milkStatus: 'Not Milking',
        reproStatus: 'N/A',
        saleDate,
        buyer,
        salePrice,
        notes: notes ? `${notes} (Sold on ${saleDate})` : `Sold to ${buyer}`,
      },
      `Animal sold to ${buyer} for ${salePrice}`,
      user
    );

    // Cancel pending reminders for this animal (Issue #17)
    if (this.reminderRepo) {
      try {
        const tasks = await this.reminderRepo.listTasks();
        const animalTasks = tasks.filter(t => t.linkedRecordId === id && t.status !== 'Completed' && t.status !== 'Cancelled');
        for (const t of animalTasks) {
          await this.reminderRepo.saveTask({ ...t, status: 'Cancelled' });
        }
      } catch (err) {
        console.warn('Could not cancel reminders on animal sale:', err);
      }
    }

    return updated;
  }

  async markDeceased(id: string, deathDate: string, deathReason: string, notes?: string, user: string = 'Operator') {
    const updated = await this.updateAnimal(
      id,
      {
        status: 'Deceased',
        milkStatus: 'Not Milking',
        reproStatus: 'N/A',
        deathDate,
        deathReason,
        notes: notes ? `${notes} (Deceased on ${deathDate})` : deathReason,
      },
      `Animal deceased: ${deathReason}`,
      user
    );

    // Close any open health cases for this animal (Issue #16)
    if (this.healthRepo) {
      try {
        const cases = await this.healthRepo.listCases({ animalId: id });
        const openCases = cases.filter(c => c.status !== 'Closed' && c.status !== 'Recovered');
        for (const c of openCases) {
          await this.healthRepo.updateCase({
            ...c,
            status: 'Closed',
            notes: c.notes ? `${c.notes} (Closed: Animal deceased)` : 'Closed: Animal deceased',
            recoveryDate: deathDate,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Could not close health cases on animal death:', err);
      }
    }

    // Cancel pending reminders for this animal (Issue #17)
    if (this.reminderRepo) {
      try {
        const tasks = await this.reminderRepo.listTasks();
        const animalTasks = tasks.filter(t => t.linkedRecordId === id && t.status !== 'Completed' && t.status !== 'Cancelled');
        for (const t of animalTasks) {
          await this.reminderRepo.saveTask({ ...t, status: 'Cancelled' });
        }
      } catch (err) {
        console.warn('Could not cancel reminders on animal death:', err);
      }
    }

    return updated;
  }

  async bulkUpdateGroup(animalIds: string[], newGroup: string, reason?: string, user: string = 'Operator') {
    const results = [];
    for (const id of animalIds) {
      const res = await this.updateAnimal(id, { group: newGroup }, reason || `Bulk group assignment to ${newGroup}`, user);
      results.push(res);
    }
    return results;
  }

  async getTimeline(animalId: string) {
    const history = await this.animalRepo.getStatusHistory(animalId);
    return history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
