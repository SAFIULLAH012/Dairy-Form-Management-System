/**
 * Pure Mathematical & Biological Domain Calculations
 * Completely platform-independent, testable, deterministic.
 */

export interface FormattedAge {
  years: number;
  months: number;
  days: number;
  display: string;
}

/**
 * Calculates animal age at a given reference date (defaulting to today).
 * Authoritative source of truth is always Date of Birth (DOB).
 */
export function calculateAge(dobString: string, referenceDateString?: string): FormattedAge {
  if (!dobString) {
    return { years: 0, months: 0, days: 0, display: '-' };
  }

  const dob = new Date(dobString + 'T00:00:00');
  const ref = referenceDateString
    ? new Date(referenceDateString + 'T00:00:00')
    : new Date();

  if (isNaN(dob.getTime()) || isNaN(ref.getTime()) || ref < dob) {
    return { years: 0, months: 0, days: 0, display: '0d' };
  }

  let years = ref.getFullYear() - dob.getFullYear();
  let months = ref.getMonth() - dob.getMonth();
  let days = ref.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let display = '';
  if (years > 0) {
    display = `${years}y ${months}m`;
  } else if (months > 0) {
    display = `${months}m ${days}d`;
  } else {
    display = `${days}d`;
  }

  return { years, months, days, display };
}

/**
 * Converts Maund to KG.
 * Domain Rule: 1 Maund = 40 KG exactly.
 */
export function maundToKg(maund: number): number {
  return Number((Number(maund || 0) * 40).toFixed(4));
}

/**
 * Converts KG to Maund.
 */
export function kgToMaund(kg: number): number {
  return Number((Number(kg || 0) / 40).toFixed(4));
}

/**
 * Calculates feed total cost.
 * Formula: KG * Price per KG
 */
export function calculateFeedCost(kg: number, pricePerKg: number): number {
  return Number((Number(kg || 0) * Number(pricePerKg || 0)).toFixed(2));
}

export interface MilkWeightedMetrics {
  totalLitres: number;
  weightedFat: number | null;
  weightedSnf: number | null;
  cowsCount: number;
  completedCount: number;
  remainingCount: number;
  sickCount: number;
}

/**
 * Calculates sum of litres, weighted Fat %, and weighted SNF %.
 * Weighted Fat = SUM(litres * fat) / SUM(litres with fat)
 * Weighted SNF = SUM(litres * snf) / SUM(litres with snf)
 */
export function calculateMilkWeighted(
  entries: Array<{
    litres: number;
    fatPercent?: number | null;
    snfPercent?: number | null;
    reason?: string;
  }>,
  totalActiveCowsCount: number
): MilkWeightedMetrics {
  let totalLitres = 0;
  let fatProductSum = 0;
  let fatLitresSum = 0;
  let snfProductSum = 0;
  let snfLitresSum = 0;
  let completedCount = 0;
  let sickCount = 0;

  for (const entry of entries) {
    const l = Number(entry.litres || 0);
    totalLitres += l;

    if (entry.reason === 'Sick') {
      sickCount++;
    }

    if (l > 0 || (entry.reason && entry.reason !== 'Normal')) {
      completedCount++;
    }

    if (l > 0 && entry.fatPercent != null && !isNaN(Number(entry.fatPercent))) {
      fatProductSum += l * Number(entry.fatPercent);
      fatLitresSum += l;
    }

    if (l > 0 && entry.snfPercent != null && !isNaN(Number(entry.snfPercent))) {
      snfProductSum += l * Number(entry.snfPercent);
      snfLitresSum += l;
    }
  }

  const weightedFat = fatLitresSum > 0 ? Number((fatProductSum / fatLitresSum).toFixed(2)) : null;
  const weightedSnf = snfLitresSum > 0 ? Number((snfProductSum / snfLitresSum).toFixed(2)) : null;
  const remainingCount = Math.max(0, totalActiveCowsCount - completedCount);

  return {
    totalLitres: Number(totalLitres.toFixed(2)),
    weightedFat,
    weightedSnf,
    cowsCount: totalActiveCowsCount,
    completedCount,
    remainingCount,
    sickCount,
  };
}

/**
 * Adds days to a date string (YYYY-MM-DD) deterministically using UTC.
 */
export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const date = new Date(Date.UTC(y, m - 1, d + Number(days)));
  return date.toISOString().slice(0, 10);
}

/**
 * Calculates Breeding Predictions:
 * - Expected Calving: Insemination Date + 283 days
 * - Expected Next Heat: Heat Date + 21 days
 * - Recommended Dry-off: Expected Calving - 60 days
 */
export function calculateBreedingPredictions(params: {
  inseminationDate?: string;
  lastHeatDate?: string;
  isPregnant?: boolean;
}) {
  let expectedCalvingDate: string | undefined;
  let recommendedDryOffDate: string | undefined;
  let expectedNextHeatDate: string | undefined;

  if (params.inseminationDate) {
    expectedCalvingDate = addDays(params.inseminationDate, 283);
    recommendedDryOffDate = addDays(expectedCalvingDate, -60);
  }

  if (params.lastHeatDate && !params.isPregnant) {
    expectedNextHeatDate = addDays(params.lastHeatDate, 21);
  }

  return {
    expectedCalvingDate,
    recommendedDryOffDate,
    expectedNextHeatDate,
  };
}

/**
 * Calculates Inventory Days Remaining.
 * Formula: Current Stock / Average Daily Consumption
 */
export function calculateDaysRemaining(currentStock: number, avgDailyConsumption: number): number | null {
  if (!avgDailyConsumption || avgDailyConsumption <= 0) {
    return null;
  }
  return Number((Math.max(0, currentStock) / avgDailyConsumption).toFixed(1));
}

/**
 * Calculates invoice balance & status.
 */
export function calculateInvoiceBalance(
  totalAmount: number,
  paidAmount: number,
  dueDate: string,
  referenceDate: string = new Date().toISOString().slice(0, 10)
): { remainingBalance: number; status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' } {
  const remainingBalance = Math.max(0, Number((totalAmount - paidAmount).toFixed(2)));
  if (remainingBalance <= 0) {
    return { remainingBalance: 0, status: 'Paid' };
  }
  if (paidAmount > 0) {
    const isOverdue = referenceDate > dueDate;
    return { remainingBalance, status: isOverdue ? 'Overdue' : 'Partially Paid' };
  }
  const isOverdue = referenceDate > dueDate;
  return { remainingBalance, status: isOverdue ? 'Overdue' : 'Unpaid' };
}

/**
 * Reconciles Farm Total Milk vs Delivered / Sold Milk.
 */
export function reconcileMilkSales(totalProduced: number, totalDelivered: number) {
  const discrepancy = Number((totalProduced - totalDelivered).toFixed(2));
  return {
    totalProduced,
    totalDelivered,
    discrepancy, // Positive = more produced than sold (farm use / retained / calf milk), Negative = more delivered than produced!
    percentageSold: totalProduced > 0 ? Number(((totalDelivered / totalProduced) * 100).toFixed(1)) : 0,
  };
}
