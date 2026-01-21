/**
 * Migration Script: Virtual Periods Architecture
 *
 * This script migrates from pre-generated budget instances to virtual periods:
 * - Deletes future non-customized Budget records (templateId != null, isCustomized = false, startDate > now)
 * - Keeps past budgets for historical accuracy
 * - Keeps customized budgets as overrides
 *
 * Run with: npx ts-node scripts/migrateToVirtualPeriods.ts
 *
 * IMPORTANT: Back up your database before running this script!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration to virtual periods architecture...\n');

  const now = new Date();
  console.log(`Current date: ${now.toISOString()}\n`);

  // Step 1: Count existing records for reporting
  const totalBudgets = await prisma.budget.count({
    where: { templateId: { not: null } },
  });
  console.log(`Total template-based budgets: ${totalBudgets}`);

  const futureNonCustomized = await prisma.budget.count({
    where: {
      templateId: { not: null },
      isCustomized: false,
      startDate: { gt: now },
    },
  });
  console.log(`Future non-customized budgets to delete: ${futureNonCustomized}`);

  const customizedBudgets = await prisma.budget.count({
    where: {
      templateId: { not: null },
      isCustomized: true,
    },
  });
  console.log(`Customized budgets to keep as overrides: ${customizedBudgets}`);

  const pastBudgets = await prisma.budget.count({
    where: {
      templateId: { not: null },
      startDate: { lte: now },
    },
  });
  console.log(`Past/current budgets to keep: ${pastBudgets}\n`);

  if (futureNonCustomized === 0) {
    console.log('No future non-customized budgets to delete. Migration complete!');
    return;
  }

  // Step 2: Confirm before deletion
  console.log('This will delete future non-customized budget instances.');
  console.log('Past budgets and customized budgets will be preserved.\n');

  // Auto-confirm in non-interactive mode or prompt manually
  const args = process.argv.slice(2);
  const autoConfirm = args.includes('--yes') || args.includes('-y');

  if (!autoConfirm) {
    console.log('To proceed, run with --yes or -y flag:');
    console.log('  npx ts-node scripts/migrateToVirtualPeriods.ts --yes\n');
    console.log('Dry run complete. No changes made.');
    return;
  }

  // Step 3: Delete future non-customized budgets
  console.log('Deleting future non-customized budgets...');

  const deleteResult = await prisma.budget.deleteMany({
    where: {
      templateId: { not: null },
      isCustomized: false,
      startDate: { gt: now },
    },
  });

  console.log(`Deleted ${deleteResult.count} budget records.\n`);

  // Step 4: Verify remaining records
  const remainingBudgets = await prisma.budget.count({
    where: { templateId: { not: null } },
  });
  console.log(`Remaining template-based budgets: ${remainingBudgets}`);

  console.log('\nMigration complete!');
  console.log('The budget system now uses virtual periods calculated on-the-fly.');
  console.log('Customized periods are stored as overrides in the Budget table.');
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
