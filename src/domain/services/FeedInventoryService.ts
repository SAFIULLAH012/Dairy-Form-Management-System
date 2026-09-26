import {
  FeedTransaction,
  InventoryItem,
  InventoryTransaction,
} from '../types.ts';
import {
  IFeedRepository,
  IInventoryRepository,
  IReminderRepository,
  IAuditRepository,
} from '../repositories.ts';
import { maundToKg, calculateFeedCost, calculateDaysRemaining } from '../calculations.ts';

export class FeedInventoryService {
  constructor(
    private feedRepo: IFeedRepository,
    private inventoryRepo: IInventoryRepository,
    private reminderRepo: IReminderRepository,
    private auditRepo: IAuditRepository
  ) {}

  async recordFeedConsumption(params: {
    date: string;
    group: string;
    feedType: string;
    maund: number;
    pricePerKg: number;
    supplier?: string;
    notes?: string;
    user?: string;
  }): Promise<FeedTransaction> {
    const kg = maundToKg(params.maund);
    const totalCost = calculateFeedCost(kg, params.pricePerKg);
    const now = new Date().toISOString();

    const tx: FeedTransaction = {
      id: `FEED_TX_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: params.date,
      group: params.group,
      feedType: params.feedType,
      maund: Number(params.maund),
      kg,
      pricePerKg: Number(params.pricePerKg),
      totalCost,
      supplier: params.supplier,
      notes: params.notes,
      createdAt: now,
    };

    const saved = await this.feedRepo.createTransaction(tx);

    // Automatically deduct from Inventory if item exists with matching name
    const invItem = await this.inventoryRepo.findItemByName(params.feedType);
    if (invItem) {
      await this.recordStockMovement({
        itemId: invItem.id,
        date: params.date,
        type: 'STOCK_OUT',
        quantity: kg,
        unitCost: params.pricePerKg,
        reference: tx.id,
        notes: `Feed consumption for group ${params.group}`,
        user: params.user,
      });
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'FEED',
      recordId: saved.id,
      newValues: saved,
      user: params.user || 'Operator',
    });

    return saved;
  }

  async recordStockMovement(params: {
    itemId: string;
    date: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'WASTAGE';
    quantity: number;
    unitCost?: number;
    reference?: string;
    notes?: string;
    user?: string;
  }): Promise<InventoryTransaction> {
    const item = await this.inventoryRepo.findItemById(params.itemId);
    if (!item) {
      throw new Error(`Inventory item ${params.itemId} not found.`);
    }

    const qty = Number(params.quantity);
    const signedQuantity =
      params.type === 'STOCK_OUT' || params.type === 'WASTAGE' ? -qty : qty;

    const newStock = Math.max(0, item.currentStock + signedQuantity);
    const cost = params.unitCost ?? 0;
    const now = new Date().toISOString();

    const tx: InventoryTransaction = {
      id: `INV_TX_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      itemId: item.id,
      itemName: item.name,
      date: params.date,
      type: params.type,
      quantity: qty,
      signedQuantity,
      unit: item.unit,
      unitCost: cost,
      totalValue: Number((qty * cost).toFixed(2)),
      reference: params.reference,
      notes: params.notes,
      createdAt: now,
    };

    const savedTx = await this.inventoryRepo.recordTransaction(tx);

    // Update item current stock
    const updatedItem = await this.inventoryRepo.saveItem({
      ...item,
      currentStock: Number(newStock.toFixed(2)),
      updatedAt: now,
    });

    // Check low stock threshold
    if (updatedItem.currentStock <= updatedItem.minStockThreshold) {
      await this.reminderRepo.saveTask({
        id: `TASK_LOW_STOCK_${updatedItem.id}`,
        title: `Low Stock Alert: ${updatedItem.name} (${updatedItem.currentStock} ${updatedItem.unit} remaining)`,
        sourceModule: 'inventory',
        dueDate: params.date,
        dueTime: '08:00',
        status: 'Due',
        linkedRecordId: updatedItem.id,
        autoKey: `LOW_STOCK_${updatedItem.id}`,
        createdAt: now,
      });
    }

    return savedTx;
  }

  async getInventoryStatus() {
    const items = await this.inventoryRepo.listItems();
    return items.map(item => {
      const daysRemaining = calculateDaysRemaining(
        item.currentStock,
        item.avgDailyConsumption || 0
      );
      const isLowStock = item.currentStock <= item.minStockThreshold;

      return {
        ...item,
        daysRemaining,
        isLowStock,
      };
    });
  }
}
