-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN "type" "BudgetType" NOT NULL DEFAULT 'EXPENSE';

-- AlterTable
ALTER TABLE "budget_templates" ADD COLUMN "type" "BudgetType" NOT NULL DEFAULT 'EXPENSE';
