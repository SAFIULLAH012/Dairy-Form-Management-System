import {
  IMilkRepository,
  IFeedRepository,
  IDeliveryRepository,
  IPaymentRepository,
  IExpenseRepository,
  IAnimalRepository,
} from '../repositories.ts';
import { reconcileMilkSales } from '../calculations.ts';

export class ReportService {
  constructor(
    private milkRepo: IMilkRepository,
    private feedRepo: IFeedRepository,
    private deliveryRepo: IDeliveryRepository,
    private paymentRepo: IPaymentRepository,
    private expenseRepo: IExpenseRepository,
    private animalRepo: IAnimalRepository
  ) {}

  async generateFinancialReport(fromDate: string, toDate: string) {
    const milkTotals = await this.milkRepo.listTotalEntries(fromDate, toDate);
    const feedTxs = await this.feedRepo.listTransactions(fromDate, toDate);
    const invoices = await this.deliveryRepo.listInvoices({ fromDate, toDate });
    const payments = await this.paymentRepo.listAll(fromDate, toDate);
    const expenses = await this.expenseRepo.listExpenses({ fromDate, toDate });

    // Sum calculations
    const totalMilkLitres = milkTotals.reduce((s, m) => s + m.totalLitres, 0);
    const totalMilkSales = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalMilkDeliveredLitres = invoices.reduce((s, i) => s + i.litres, 0);
    const totalCashReceived = payments.reduce((s, p) => s + p.amount, 0);
    const totalFeedCost = feedTxs.reduce((s, f) => s + f.totalCost, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const totalIncome = totalMilkSales;
    const totalCosts = totalFeedCost + totalExpenses;
    const netProfitOrLoss = Number((totalIncome - totalCosts).toFixed(2));

    // Milk reconciliation
    const reconciliation = reconcileMilkSales(totalMilkLitres, totalMilkDeliveredLitres);

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    }

    // Daily milk trend map
    const dailyMilkMap: Record<string, number> = {};
    for (const m of milkTotals) {
      dailyMilkMap[m.date] = (dailyMilkMap[m.date] || 0) + m.totalLitres;
    }

    const dailyTrend = Object.entries(dailyMilkMap)
      .map(([date, litres]) => ({ date, litres: Number(litres.toFixed(1)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: { fromDate, toDate },
      kpis: {
        totalMilkLitres: Number(totalMilkLitres.toFixed(1)),
        totalMilkDeliveredLitres: Number(totalMilkDeliveredLitres.toFixed(1)),
        totalMilkSales: Number(totalMilkSales.toFixed(2)),
        totalCashReceived: Number(totalCashReceived.toFixed(2)),
        totalFeedCost: Number(totalFeedCost.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalCosts: Number(totalCosts.toFixed(2)),
        netProfitOrLoss,
      },
      reconciliation,
      expensesByCategory,
      dailyTrend,
    };
  }

  async getHerdStatistics() {
    const animals = await this.animalRepo.listAll();
    const active = animals.filter(a => a.status === 'Active');

    const females = active.filter(a => a.sex === 'Female');
    const males = active.filter(a => a.sex === 'Male');

    const milking = females.filter(a => a.milkStatus === 'Milking');
    const dry = females.filter(a => a.milkStatus === 'Dry');
    const pregnant = females.filter(a => a.reproStatus === 'Pregnant');
    const heifers = females.filter(a => a.stage === 'Heifer');
    const calves = active.filter(a => a.stage === 'Calf');

    return {
      totalActive: active.length,
      femalesCount: females.length,
      malesCount: males.length,
      milkingCount: milking.length,
      dryCount: dry.length,
      pregnantCount: pregnant.length,
      heifersCount: heifers.length,
      calvesCount: calves.length,
    };
  }
}
