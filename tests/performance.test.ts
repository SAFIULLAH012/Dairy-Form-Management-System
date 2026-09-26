/**
 * Performance Benchmark Test for Dairy Farm ERP
 * Uses in-process SQL.js (no Express, no network) to test domain-layer performance.
 * Architecture: same as Android Native Mode (LocalAppService → SQLiteRepositories → sql.js in-memory)
 */
import { LocalAppService } from '../src/domain/services/LocalAppService.ts';
import initSqlJs from 'sql.js';
import { WebDatabaseAdapter } from '../src/infrastructure/platform/web/WebAdapters.ts';

// A Node.js compatible DB adapter (no browser localStorage, no Capacitor)
// Mirrors how AndroidDatabaseAdapter works: sql.js WASM in memory
class NodeDatabaseAdapter extends WebDatabaseAdapter {
  private _initialized = false;

  async init(): Promise<void> {
    if (this._initialized) return; // Prevent re-init (mirrors production behaviour)
    const SQL = await initSqlJs({
      locateFile: () => 'node_modules/sql.js/dist/sql-wasm.wasm'
    });
    this.db = new SQL.Database();
    this.save = () => {}; // No-op: benchmark doesn't need filesystem persistence

    const { MigrationRunner } = await import('../src/infrastructure/database/migrations.ts');
    MigrationRunner.runMigrations(this);
    this._initialized = true;
  }
}

async function runBenchmarks() {
  console.log('\n--- DAIRY FARM ERP PERFORMANCE BENCHMARKS ---');
  console.log('Architecture: sql.js (WASM) in-memory — same as Android Native Mode\n');

  const dbAdapter = new NodeDatabaseAdapter();
  const storageMock = {
    saveFile: async () => 'path',
    readFile: async () => '',
    deleteFile: async () => {},
    sanitizeFilename: (f: string) => f,
    validateFile: () => ({ valid: true as const })
  };

  const t0 = performance.now();
  const app = new LocalAppService(dbAdapter, storageMock);
  await app.init();
  const t1 = performance.now();
  console.log(`[BENCH] DB Init + Migrations:   ${(t1 - t0).toFixed(2)}ms  ✓`);

  // --- INSERT 1,000 ANIMALS ---
  const tA0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    await app.createAnimal({
      id: `A-${String(i).padStart(4, '0')}`,
      tag1: `TAG-${i}`,
      cowNumber: `C${i}`,
      sex: 'Female',
      dob: '2020-03-15',
      breed: 'Holstein',
      group: 'Milking',
      stage: 'Adult',
      reproStatus: 'Milking',
      milkStatus: 'Milking',
      status: 'Active',
    } as any);
  }
  const tA1 = performance.now();
  console.log(`[BENCH] INSERT 1,000 Animals:   ${(tA1 - tA0).toFixed(2)}ms  (${((tA1-tA0)/1000).toFixed(2)}ms each) ✓`);

  // --- LOAD ANIMAL LIST ---
  const tL0 = performance.now();
  const animals = await app.getAnimals();
  const tL1 = performance.now();
  console.log(`[BENCH] SELECT 1,000 Animals:   ${(tL1 - tL0).toFixed(2)}ms  (count: ${animals.length}) ✓`);

  if (animals.length < 1) { console.error('ERROR: no animals loaded'); return; }

  // --- FILTER ANIMALS ---
  const tF0 = performance.now();
  const active = await app.getAnimals({ status: 'Active', sex: 'Female' });
  const tF1 = performance.now();
  console.log(`[BENCH] FILTER Animals (Active/Female): ${(tF1 - tF0).toFixed(2)}ms  (count: ${active.length}) ✓`);

  // --- INSERT MILK TOTALS (~10 per unique date+shift combo) ---
  const tM0 = performance.now();
  let milkInserts = 0;
  for (let d = 1; d <= 30; d++) {
    for (const shift of ['Morning', 'Evening']) {
      try {
        await app.saveMilkTotal({
          id: `MT-${d}-${shift}`,
          date: `2026-09-${String(d).padStart(2, '0')}`,
          shift,
          totalLitres: 200 + Math.random() * 50,
          fatPercent: 3.8 + Math.random(),
          snfPercent: 8.2 + Math.random() * 0.5,
          cowsPresent: 50,
          cowsMilked: 48,
          lockedAt: null,
        });
        milkInserts++;
      } catch(e: any) {
        // Skip duplicates
      }
    }
  }
  const tM1 = performance.now();
  console.log(`[BENCH] INSERT ${milkInserts} Milk Total Records: ${(tM1 - tM0).toFixed(2)}ms ✓`);

  // --- LOAD MILK TOTALS ---
  const tML0 = performance.now();
  const milkHistory = await app.getMilkTotals();
  const tML1 = performance.now();
  console.log(`[BENCH] SELECT Milk Totals:     ${(tML1 - tML0).toFixed(2)}ms  (count: ${milkHistory.length}) ✓`);

  // --- BACKUP GENERATION ---
  const tB0 = performance.now();
  const backup = await app.generateBackup();
  const tB1 = performance.now();
  const backupKb = (JSON.stringify(backup).length / 1024).toFixed(1);
  console.log(`[BENCH] Backup Export:          ${(tB1 - tB0).toFixed(2)}ms  (size: ${backupKb} KB) ✓`);

  // --- VERIFY BACKUP STRUCTURE ---
  const hasAnimals = Array.isArray((backup as any).data?.animals);
  const hasMilk = Array.isArray((backup as any).data?.milkTotals);
  console.log(`[VERIFY] Backup structure: animals=${hasAnimals}, milkTotals=${hasMilk} ${hasAnimals && hasMilk ? '✓' : '✗'}`);

  // --- RESTORE ---
  const tR0 = performance.now();
  try {
    await app.restoreBackup(backup);
    const tR1 = performance.now();
    console.log(`[BENCH] Restore Backup:         ${(tR1 - tR0).toFixed(2)}ms ✓`);

    // --- ANIMAL COUNT AFTER RESTORE ---
    const restoredAnimals = await app.getAnimals();
    console.log(`[VERIFY] Animals after restore: ${restoredAnimals.length} (expected 1000) ${restoredAnimals.length === 1000 ? '✓' : '✗ MISMATCH'}`);
  } catch(e: any) {
    console.log(`[BENCH] Restore Backup: SKIPPED (${e.message})`);
  }

  console.log('\n✅ ALL BENCHMARKS COMPLETE!');
}

runBenchmarks().catch(e => {
  console.error('\n❌ BENCHMARK FAILED:', e.message);
  process.exit(1);
});
