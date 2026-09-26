import {
  DeliveryInvoice,
  PaymentRecord,
  Customer,
  Worker,
  WorkerTransaction,
  ExpenseRecord,
} from '../types.ts';
import {
  IDeliveryRepository,
  IPaymentRepository,
  ICustomerRepository,
  IWorkerRepository,
  IExpenseRepository,
  IReminderRepository,
  IAuditRepository,
} from '../repositories.ts';
import { calculateInvoiceBalance, addDays } from '../calculations.ts';

export class SalesInvoiceService {
  constructor(
    private deliveryRepo: IDeliveryRepository,
    private paymentRepo: IPaymentRepository,
    private customerRepo: ICustomerRepository,
    private workerRepo: IWorkerRepository,
    private expenseRepo: IExpenseRepository,
    private reminderRepo: IReminderRepository,
    private auditRepo: IAuditRepository
  ) {}

  // ================= DELIVERIES & INVOICES =================
  async createInvoice(params: {
    customerId: string;
    customerName: string;
    receiverName?: string;
    date: string;
    time: string;
    litres: number;
    fatPercent?: number;
    snfPercent?: number;
    ratePerL: number;
    paymentTermsDays: number;
    notes?: string;
    initialPaidAmount?: number;
    user?: string;
  }): Promise<DeliveryInvoice> {
    const totalAmount = Number((params.litres * params.ratePerL).toFixed(2));
    const paidAmount = Number(params.initialPaidAmount || 0);
    const dueDate = addDays(params.date, params.paymentTermsDays);
    const balanceCalc = calculateInvoiceBalance(totalAmount, paidAmount, dueDate);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const invoice: DeliveryInvoice = {
      id: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      invoiceNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      receiverName: params.receiverName,
      date: params.date,
      time: params.time,
      litres: Number(params.litres),
      fatPercent: params.fatPercent != null ? Number(params.fatPercent) : undefined,
      snfPercent: params.snfPercent != null ? Number(params.snfPercent) : undefined,
      ratePerL: Number(params.ratePerL),
      totalAmount,
      paymentTerms: `${params.paymentTermsDays} days`,
      dueDate,
      paidAmount,
      remainingBalance: balanceCalc.remainingBalance,
      status: balanceCalc.status,
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.deliveryRepo.saveInvoice(invoice);

    if (paidAmount > 0) {
      await this.paymentRepo.createPayment({
        id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        invoiceId: saved.id,
        customerId: saved.customerId,
        date: params.date,
        amount: paidAmount,
        method: 'Cash',
        notes: 'Initial payment upon delivery',
        createdAt: now,
      });
    }

    // Schedule payment collection reminder if unpaid
    if (balanceCalc.remainingBalance > 0) {
      await this.reminderRepo.saveTask({
        id: `TASK_PAY_${saved.id}`,
        title: `Collect Payment: ${saved.customerName} (${saved.remainingBalance})`,
        sourceModule: 'deliveries',
        dueDate,
        dueTime: '10:00',
        status: 'Scheduled',
        linkedRecordId: saved.id,
        createdAt: now,
      });
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'INVOICE',
      recordId: saved.id,
      newValues: saved,
      user: params.user || 'Operator',
    });

    return saved;
  }

  async recordPayment(params: {
    invoiceId: string;
    date: string;
    amount: number;
    method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';
    reference?: string;
    notes?: string;
    user?: string;
  }): Promise<PaymentRecord> {
    const invoice = await this.deliveryRepo.findById(params.invoiceId);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found.`);

    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    if (params.amount > invoice.remainingBalance + 0.01) {
      throw new Error(
        `Payment amount (${params.amount}) exceeds remaining balance (${invoice.remainingBalance}).`
      );
    }

    const now = new Date().toISOString();
    const payment: PaymentRecord = {
      id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      date: params.date,
      amount: Number(params.amount),
      method: params.method,
      reference: params.reference,
      notes: params.notes,
      createdAt: now,
    };

    const savedPayment = await this.paymentRepo.createPayment(payment);

    const newPaidAmount = Number((invoice.paidAmount + payment.amount).toFixed(2));
    const balanceCalc = calculateInvoiceBalance(invoice.totalAmount, newPaidAmount, invoice.dueDate);

    await this.deliveryRepo.saveInvoice({
      ...invoice,
      paidAmount: newPaidAmount,
      remainingBalance: balanceCalc.remainingBalance,
      status: balanceCalc.status,
      updatedAt: now,
    });

    if (balanceCalc.remainingBalance <= 0) {
      const task = await this.reminderRepo.findTaskByAutoKey(`TASK_PAY_${invoice.id}`);
      if (task) {
        await this.reminderRepo.completeTask(task.id);
      }
    }

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'PAYMENT',
      recordId: savedPayment.id,
      newValues: savedPayment,
      user: params.user || 'Operator',
    });

    return savedPayment;
  }

  // ================= WORKERS & ADVANCES =================
  async recordWorkerTransaction(params: {
    workerId: string;
    date: string;
    type: 'Advance' | 'Salary Payment' | 'Deduction' | 'Bonus';
    amount: number;
    notes?: string;
    user?: string;
  }): Promise<WorkerTransaction> {
    const worker = await this.workerRepo.findWorkerById(params.workerId);
    if (!worker) throw new Error(`Worker ${params.workerId} not found.`);

    const now = new Date().toISOString();
    const tx: WorkerTransaction = {
      id: `WTX_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      workerId: worker.id,
      workerName: worker.name,
      date: params.date,
      type: params.type,
      amount: Number(params.amount),
      notes: params.notes,
      createdAt: now,
    };

    const saved = await this.workerRepo.createTransaction(tx);

    // If salary payment or advance, also record corresponding financial expense
    if (params.type === 'Salary Payment' || params.type === 'Advance') {
      await this.expenseRepo.createExpense({
        id: `EXP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        date: params.date,
        category: 'Labour',
        amount: params.amount,
        vendor: worker.name,
        paymentMethod: 'Cash',
        reference: tx.id,
        notes: `${params.type} for ${worker.name}`,
        createdAt: now,
      });
    }

    return saved;
  }

  async getWorkerLedger(workerId: string) {
    const worker = await this.workerRepo.findWorkerById(workerId);
    if (!worker) throw new Error(`Worker ${workerId} not found.`);

    const transactions = await this.workerRepo.listTransactions(workerId);
    let totalAdvance = 0;
    let totalSalaryPaid = 0;
    let totalDeductions = 0;
    let totalBonuses = 0;

    for (const tx of transactions) {
      if (tx.type === 'Advance') totalAdvance += tx.amount;
      if (tx.type === 'Salary Payment') totalSalaryPaid += tx.amount;
      if (tx.type === 'Deduction') totalDeductions += tx.amount;
      if (tx.type === 'Bonus') totalBonuses += tx.amount;
    }

    // Outstanding advance remaining = totalAdvance - totalDeductions
    const outstandingAdvance = Math.max(0, totalAdvance - totalDeductions);

    return {
      worker,
      transactions,
      summary: {
        totalAdvance,
        totalSalaryPaid,
        totalDeductions,
        totalBonuses,
        outstandingAdvance,
      },
    };
  }

  // ================= EXPENSES =================
  async recordExpense(data: Omit<ExpenseRecord, 'id' | 'createdAt'>, user: string = 'Operator'): Promise<ExpenseRecord> {
    const now = new Date().toISOString();
    const expense: ExpenseRecord = {
      ...data,
      id: `EXP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
    };

    const saved = await this.expenseRepo.createExpense(expense);

    await this.auditRepo.log({
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      action: 'CREATE',
      module: 'EXPENSE',
      recordId: saved.id,
      newValues: saved,
      user,
    });

    return saved;
  }
}
