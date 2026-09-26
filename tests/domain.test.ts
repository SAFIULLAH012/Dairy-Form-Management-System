import {
  calculateAge,
  maundToKg,
  kgToMaund,
  calculateFeedCost,
  calculateMilkWeighted,
  addDays,
  calculateBreedingPredictions,
  calculateDaysRemaining,
  calculateInvoiceBalance,
  reconcileMilkSales,
} from '../src/domain/calculations.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

function assertClose(actual: number | null | undefined, expected: number, tolerance = 0.01, msg: string) {
  if (actual == null || Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion failed: ${msg} (expected ${expected}, got ${actual})`);
  }
  console.log(`  ✓ ${msg}`);
}

export function runDomainTests() {
  console.log('--- STARTING DAIRY FARM ERP DOMAIN TEST SUITE ---');

  // 1 & 2: Animal Age & Historical Date Age
  console.log('\n[Testing Animal Age Calculation]');
  const ageNow = calculateAge('2023-01-01', '2026-09-25');
  assert(ageNow.years === 3 && ageNow.months === 8 && ageNow.days === 24, 'Age at 2026-09-25 for DOB 2023-01-01 is 3y 8m');
  assert(ageNow.display === '3y 8m', 'Formatted display matches 3y 8m');

  const ageHistorical = calculateAge('2023-01-01', '2023-06-01');
  assert(ageHistorical.months === 5 && ageHistorical.years === 0, 'Historical age at 2023-06-01 is 5m');

  // 3 & 4: Maund -> KG and Feed Cost
  console.log('\n[Testing Feed Calculations]');
  assert(maundToKg(1) === 40, '1 Maund = 40 KG');
  assert(maundToKg(5) === 200, '5 Maund = 200 KG');
  assert(maundToKg(20) === 800, '20 Maund = 800 KG');
  assert(kgToMaund(40) === 1, '40 KG = 1 Maund');

  const feedCost = calculateFeedCost(200, 18.5);
  assert(feedCost === 3700, 'Feed Cost: 200 KG * Rs. 18.5/KG = Rs. 3,700');

  // 5, 6, 7 & 46: Acceptance Test Milk Calculations (Morning 12L @ 4% Fat, 8.5% SNF + Afternoon 10L @ 4.2% Fat, 8.6% SNF)
  console.log('\n[Testing Milk Weighted Metrics & Acceptance Test]');
  const acceptanceEntries = [
    { litres: 12, fatPercent: 4.0, snfPercent: 8.5, reason: 'Normal' },
    { litres: 10, fatPercent: 4.2, snfPercent: 8.6, reason: 'Normal' },
  ];
  const milkMetrics = calculateMilkWeighted(acceptanceEntries, 2);

  assert(milkMetrics.totalLitres === 22.0, 'Total milk = 22 L');
  // Weighted Fat = (12 * 4.0 + 10 * 4.2) / 22 = (48 + 42) / 22 = 90 / 22 = 4.0909... => 4.09%
  assertClose(milkMetrics.weightedFat, 4.09, 0.01, 'Weighted Fat is mathematically 4.09%');
  // Weighted SNF = (12 * 8.5 + 10 * 8.6) / 22 = (102 + 86) / 22 = 188 / 22 = 8.5454... => 8.55%
  assertClose(milkMetrics.weightedSnf, 8.55, 0.01, 'Weighted SNF is mathematically 8.55%');
  assert(milkMetrics.completedCount === 2 && milkMetrics.remainingCount === 0, 'Shift has 2 completed cows and 0 remaining');

  // 8, 9, 10 & 46: Invoice & Payment Acceptance Test
  console.log('\n[Testing Invoices, Terms & Payments]');
  // 320 L * 210/L = 67,200
  const invoiceTotal = 320 * 210;
  assert(invoiceTotal === 67200, '320 L * Rs. 210/L = Rs. 67,200');

  const invoiceDueDate = addDays('2026-06-01', 7);
  assert(invoiceDueDate === '2026-06-08', '7 days payment terms calculates due date 2026-06-08 from 2026-06-01');

  // Partial Payment 30,000 -> Remaining 37,200
  const paymentBalance = calculateInvoiceBalance(67200, 30000, invoiceDueDate, '2026-06-05');
  assert(paymentBalance.remainingBalance === 37200, 'Remaining balance after Rs. 30,000 payment = Rs. 37,200');
  assert(paymentBalance.status === 'Partially Paid', 'Status is Partially Paid');

  // Full Payment -> Remaining 0, Status Paid
  const fullPaymentBalance = calculateInvoiceBalance(67200, 67200, invoiceDueDate, '2026-06-05');
  assert(fullPaymentBalance.remainingBalance === 0, 'Remaining balance is 0 upon full settlement');
  assert(fullPaymentBalance.status === 'Paid', 'Status is Paid');

  // 11, 12, 13 & 46: Breeding Calculations (Insemination June 1, 2026)
  console.log('\n[Testing Breeding Predictions]');
  const breedingPred = calculateBreedingPredictions({
    inseminationDate: '2026-06-01',
    lastHeatDate: '2026-05-11',
    isPregnant: false,
  });
  // Expected calving: Insemination + 283 days
  // 2026 is not a leap year. June (29d left) + July(31) + Aug(31) + Sep(30) + Oct(31) + Nov(30) + Dec(31) + Jan(31) + Feb(28) + March(11) = 283d => 2027-03-11
  assert(breedingPred.expectedCalvingDate === '2027-03-11', 'Expected Calving is exactly 2027-03-11 (+283 days)');
  // Dry-off target: Expected Calving - 60 days => 2027-01-10
  assert(breedingPred.recommendedDryOffDate === '2027-01-10', 'Recommended Dry-off is 2027-01-10 (-60 days from calving)');
  // Next heat: Last heat (2026-05-11) + 21 days => 2026-06-01
  assert(breedingPred.expectedNextHeatDate === '2026-06-01', 'Expected next heat is +21 days from heat date');

  // 14 & 15: Inventory Days Remaining
  console.log('\n[Testing Inventory Days Remaining]');
  // 800 KG stock, 200 KG/day consumption => 4 days remaining
  const daysLeft = calculateDaysRemaining(800, 200);
  assert(daysLeft === 4.0, '800 KG / 200 KG/day = 4 days remaining');

  // 23: Milk to Sales Reconciliation
  console.log('\n[Testing Milk to Sales Reconciliation]');
  const recon = reconcileMilkSales(500, 450);
  assert(recon.totalProduced === 500 && recon.totalDelivered === 450, 'Produced 500L, Delivered 450L');
  assert(recon.discrepancy === 50, 'Discrepancy (retained on farm) = 50L');
  assert(recon.percentageSold === 90, 'Percentage sold = 90%');

  console.log('\n✅ ALL DOMAIN TESTS PASSED SUCCESSFULLY!\n');
}

// Run if called directly
runDomainTests();
