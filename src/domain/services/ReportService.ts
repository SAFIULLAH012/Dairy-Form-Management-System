import {
  IMilkRepository,
  IFeedRepository,
  IDeliveryRepository,
  IPaymentRepository,
  IExpenseRepository,
  IAnimalRepository,
  IWorkerRepository,
} from '../repositories.ts';
import { reconcileMilkSales } from '../calculations.ts';

export class ReportService {
  constructor(
    private milkRepo: IMilkRepository,
    private feedRepo: IFeedRepository,
    private deliveryRepo: IDeliveryRepository,
    private paymentRepo: IPaymentRepository,
    private expenseRepo: IExpenseRepository,
    private animalRepo: IAnimalRepository,
    private workerRepo?: IWorkerRepository
  ) {}

  async generateFinancialReport(fromDate: string, toDate: string) {
    const milkTotals = await this.milkRepo.listTotalEntries(fromDate, toDate);
    const feedTxs = await this.feedRepo.listTransactions(fromDate, toDate);
    const invoices = await this.deliveryRepo.listInvoices({ fromDate, toDate });
    const payments = await this.paymentRepo.listAll(fromDate, toDate);
    const expenses = await this.expenseRepo.listExpenses({ fromDate, toDate });

    // Fetch animals sold within the report period (slice date to prevent ISO format comparison mismatch)
    const allAnimals = await this.animalRepo.listAll({ status: 'Sold' });
    const soldInPeriod = allAnimals.filter(a => {
      const sDate = a.saleDate ? a.saleDate.slice(0, 10) : '';
      return sDate && sDate >= fromDate && sDate <= toDate;
    });
    const totalAnimalSalesRevenue = soldInPeriod.reduce((s, a) => s + (a.salePrice || 0), 0);

    // Sum calculations
    const totalMilkLitres = milkTotals.reduce((s, m) => s + m.totalLitres, 0);
    const totalMilkSales = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalMilkDeliveredLitres = invoices.reduce((s, i) => s + i.litres, 0);
    const totalCashReceived = payments.reduce((s, p) => s + p.amount, 0);
    const totalFeedCost = feedTxs.reduce((s, f) => s + f.totalCost, 0);

    // Fetch worker salaries if workerRepo is available (Issue #1)
    let totalWorkerSalaries = 0;
    if (this.workerRepo) {
      try {
        const workerTxs = await this.workerRepo.listTransactions();
        const periodTxs = workerTxs.filter(t => {
          const tDate = t.date ? t.date.slice(0, 10) : '';
          return tDate >= fromDate && tDate <= toDate && (t.type === 'Salary Payment' || t.type === 'Advance');
        });
        totalWorkerSalaries = periodTxs.reduce((s, t) => s + (t.amount || 0), 0);
      } catch (err) {
        console.warn('Could not fetch worker transactions for financial report:', err);
      }
    }

    // Prevent double counting feed bills when daily feed consumption is already logged (Issue #2)
    const nonFeedExpenses = expenses.filter(e => e.category !== 'Feed');
    const feedCategoryExpenses = expenses.filter(e => e.category === 'Feed');
    const totalNonFeedExpenses = nonFeedExpenses.reduce((s, e) => s + e.amount, 0);
    const totalFeedBills = feedCategoryExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Effective operational costs: if daily feed consumption is logged, use that + non-feed expenses + payroll
    const effectiveFeedCost = totalFeedCost > 0 ? totalFeedCost : totalFeedBills;
    const totalIncome = Number((totalMilkSales + totalAnimalSalesRevenue).toFixed(2));
    const totalCosts = Number((effectiveFeedCost + totalNonFeedExpenses + totalWorkerSalaries).toFixed(2));
    const netProfitOrLoss = Number((totalIncome - totalCosts).toFixed(2));

    // Milk reconciliation
    const reconciliation = reconcileMilkSales(totalMilkLitres, totalMilkDeliveredLitres);

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    }
    if (totalWorkerSalaries > 0 && !expensesByCategory['Labour']) {
      expensesByCategory['Labour'] = totalWorkerSalaries;
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
        totalAnimalSalesRevenue: Number(totalAnimalSalesRevenue.toFixed(2)),
        totalIncome,
        totalCashReceived: Number(totalCashReceived.toFixed(2)),
        totalFeedCost: Number(effectiveFeedCost.toFixed(2)),
        totalWorkerSalaries: Number(totalWorkerSalaries.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalCosts,
        netProfitOrLoss,
      },
      soldAnimals: soldInPeriod.map(a => ({
        id: a.id,
        saleDate: a.saleDate,
        salePrice: a.salePrice,
        buyer: a.buyer,
        breed: a.breed,
      })),
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
