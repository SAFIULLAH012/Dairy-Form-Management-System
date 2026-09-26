import { FarmTaskReminder, TaskStatus } from '../types.ts';
import {
  IReminderRepository,
  IMilkRepository,
  IInventoryRepository,
  IDeliveryRepository,
  IVaccinationRepository,
  IBreedingRepository,
  IHealthRepository,
  ISettingsRepository,
} from '../repositories.ts';

export class ReminderService {
  constructor(
    private reminderRepo: IReminderRepository,
    private milkRepo: IMilkRepository,
    private inventoryRepo: IInventoryRepository,
    private deliveryRepo: IDeliveryRepository,
    private vaccineRepo: IVaccinationRepository,
    private breedingRepo: IBreedingRepository,
    private healthRepo: IHealthRepository,
    private settingsRepo: ISettingsRepository
  ) {}

  /**
   * Safe evaluation on application startup.
   * Evaluates due/overdue status of tasks and checks for operational gaps
   * (e.g. missing daily milk, low inventory, overdue invoices).
   * Does NOT alter historical facts.
   */
  async runStartupEvaluation(currentDate: string = new Date().toISOString().slice(0, 10)) {
    const tasks = await this.reminderRepo.listTasks();
    const currentTime = new Date().toTimeString().slice(0, 5);

    // 1. Update task statuses
    for (const t of tasks) {
      if (t.status === 'Completed' || t.status === 'Cancelled') continue;

      let newStatus: TaskStatus = t.status;
      if (t.dueDate < currentDate) {
        newStatus = 'Overdue';
      } else if (t.dueDate === currentDate) {
        newStatus = t.dueTime <= currentTime ? 'Overdue' : 'Due';
      } else {
        newStatus = 'Scheduled';
      }

      if (newStatus !== t.status) {
        await this.reminderRepo.saveTask({
          ...t,
          status: newStatus,
        });
      }
    }

    // 2. Daily Milk Entry checks for today
    const shifts = await this.milkRepo.getShifts();
    for (const shift of shifts) {
      if (!shift.active) continue;
      const autoKey = `DAILY_MILK_${currentDate}_${shift.name}`;
      const existingTask = await this.reminderRepo.findTaskByAutoKey(autoKey);
      const milkRecord = await this.milkRepo.findTotalEntry(currentDate, shift.name);

      if (!milkRecord && !existingTask) {
        await this.reminderRepo.saveTask({
          id: `TASK_MILK_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          title: `Record ${shift.name} Milk Entry`,
          sourceModule: 'milk',
          dueDate: currentDate,
          dueTime: shift.endTime,
          status: shift.endTime < currentTime ? 'Overdue' : 'Due',
          autoKey,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Low stock inventory scan
    const invItems = await this.inventoryRepo.listItems();
    for (const item of invItems) {
      if (item.currentStock <= item.minStockThreshold) {
        const autoKey = `LOW_STOCK_${item.id}`;
        const existingTask = await this.reminderRepo.findTaskByAutoKey(autoKey);
        if (!existingTask) {
          await this.reminderRepo.saveTask({
            id: `TASK_STOCK_${item.id}`,
            title: `Low Stock: ${item.name} (${item.currentStock} ${item.unit} left)`,
            sourceModule: 'inventory',
            dueDate: currentDate,
            dueTime: '08:00',
            status: 'Due',
            autoKey,
            linkedRecordId: item.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Overdue invoice scan
    const invoices = await this.deliveryRepo.listInvoices();
    for (const inv of invoices) {
      if (inv.remainingBalance > 0 && inv.dueDate < currentDate) {
        const autoKey = `OVERDUE_INV_${inv.id}`;
        const existingTask = await this.reminderRepo.findTaskByAutoKey(autoKey);
        if (!existingTask) {
          await this.reminderRepo.saveTask({
            id: `TASK_INV_${inv.id}`,
            title: `Payment Overdue: ${inv.customerName} (${inv.remainingBalance})`,
            sourceModule: 'deliveries',
            dueDate: inv.dueDate,
            dueTime: '10:00',
            status: 'Overdue',
            autoKey,
            linkedRecordId: inv.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 5. Vaccination schedule check
    const vaccines = await this.vaccineRepo.listRecords();
    for (const vac of vaccines) {
      if (vac.status !== 'Completed' && vac.nextDueDate <= currentDate) {
        const autoKey = `VAC_DUE_${vac.id}`;
        const existingTask = await this.reminderRepo.findTaskByAutoKey(autoKey);
        if (!existingTask) {
          await this.reminderRepo.saveTask({
            id: `TASK_VAC_${vac.id}`,
            title: `Vaccine Due: ${vac.vaccineType} for ${vac.animalId}`,
            sourceModule: 'vaccination',
            dueDate: vac.nextDueDate,
            dueTime: '09:00',
            status: vac.nextDueDate < currentDate ? 'Overdue' : 'Due',
            autoKey,
            linkedRecordId: vac.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  async getNotificationCenterSummary(currentDate: string = new Date().toISOString().slice(0, 10)) {
    const tasks = await this.reminderRepo.listTasks();
    const activeTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');

    const overdue = activeTasks.filter(t => t.status === 'Overdue');
    const dueToday = activeTasks.filter(t => t.dueDate === currentDate && t.status !== 'Overdue');
    const dueSoon = activeTasks.filter(t => t.dueDate > currentDate);

    return {
      totalPending: activeTasks.length,
      overdue,
      dueToday,
      dueSoon,
      byModule: {
        milk: activeTasks.filter(t => t.sourceModule === 'milk'),
        feed: activeTasks.filter(t => t.sourceModule === 'feed'),
        inventory: activeTasks.filter(t => t.sourceModule === 'inventory'),
        health: activeTasks.filter(t => t.sourceModule === 'health'),
        vaccination: activeTasks.filter(t => t.sourceModule === 'vaccination'),
        breeding: activeTasks.filter(t => t.sourceModule === 'breeding'),
        deliveries: activeTasks.filter(t => t.sourceModule === 'deliveries'),
        workers: activeTasks.filter(t => t.sourceModule === 'workers'),
      },
    };
  }
}
