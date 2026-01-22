-- CreateEnum
CREATE TYPE "DayOfMonthType" AS ENUM ('FIXED', 'LAST_DAY', 'FIRST_WEEKDAY', 'LAST_WEEKDAY', 'FIRST_OF_WEEK', 'LAST_OF_WEEK');

-- CreateEnum
CREATE TYPE "ImplicitSpendMode" AS ENUM ('DAILY', 'END_OF_PERIOD', 'NONE');

-- CreateEnum
CREATE TYPE "MatchMethod" AS ENUM ('AUTO', 'AUTO_REVIEWED', 'MANUAL');

-- AlterTable
ALTER TABLE "budget_templates" ADD COLUMN     "implicitSpendMode" "ImplicitSpendMode" NOT NULL DEFAULT 'DAILY';

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "implicitSpendMode" "ImplicitSpendMode" NOT NULL DEFAULT 'DAILY';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "planned_transaction_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "isTransfer" BOOLEAN NOT NULL DEFAULT false,
    "transferToAccountId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "periodType" "BudgetPeriod" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "firstOccurrence" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "dayOfMonth" INTEGER,
    "dayOfMonthType" "DayOfMonthType",
    "dayOfWeek" INTEGER,
    "autoMatchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "skipReview" BOOLEAN NOT NULL DEFAULT false,
    "matchTolerance" DECIMAL(12,2),
    "matchWindowDays" INTEGER NOT NULL DEFAULT 7,
    "budgetId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_transaction_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "isTransfer" BOOLEAN NOT NULL DEFAULT false,
    "transferToAccountId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "autoMatchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "skipReview" BOOLEAN NOT NULL DEFAULT false,
    "matchTolerance" DECIMAL(12,2),
    "matchWindowDays" INTEGER NOT NULL DEFAULT 7,
    "budgetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matched_transactions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "plannedTemplateId" TEXT,
    "plannedExpectedDate" TIMESTAMP(3) NOT NULL,
    "plannedAmount" DECIMAL(12,2) NOT NULL,
    "matchConfidence" DECIMAL(5,2) NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchMethod" "MatchMethod" NOT NULL,

    CONSTRAINT "matched_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planned_transaction_templates_userId_idx" ON "planned_transaction_templates"("userId");

-- CreateIndex
CREATE INDEX "planned_transaction_templates_accountId_idx" ON "planned_transaction_templates"("accountId");

-- CreateIndex
CREATE INDEX "planned_transaction_templates_categoryId_idx" ON "planned_transaction_templates"("categoryId");

-- CreateIndex
CREATE INDEX "planned_transaction_templates_budgetId_idx" ON "planned_transaction_templates"("budgetId");

-- CreateIndex
CREATE INDEX "planned_transaction_templates_isActive_idx" ON "planned_transaction_templates"("isActive");

-- CreateIndex
CREATE INDEX "planned_transaction_templates_firstOccurrence_idx" ON "planned_transaction_templates"("firstOccurrence");

-- CreateIndex
CREATE INDEX "planned_transactions_userId_idx" ON "planned_transactions"("userId");

-- CreateIndex
CREATE INDEX "planned_transactions_templateId_idx" ON "planned_transactions"("templateId");

-- CreateIndex
CREATE INDEX "planned_transactions_accountId_idx" ON "planned_transactions"("accountId");

-- CreateIndex
CREATE INDEX "planned_transactions_categoryId_idx" ON "planned_transactions"("categoryId");

-- CreateIndex
CREATE INDEX "planned_transactions_budgetId_idx" ON "planned_transactions"("budgetId");

-- CreateIndex
CREATE INDEX "planned_transactions_expectedDate_idx" ON "planned_transactions"("expectedDate");

-- CreateIndex
CREATE INDEX "planned_transactions_isOverride_idx" ON "planned_transactions"("isOverride");

-- CreateIndex
CREATE UNIQUE INDEX "matched_transactions_transactionId_key" ON "matched_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "matched_transactions_transactionId_idx" ON "matched_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "matched_transactions_plannedTemplateId_idx" ON "matched_transactions"("plannedTemplateId");

-- CreateIndex
CREATE INDEX "matched_transactions_matchedAt_idx" ON "matched_transactions"("matchedAt");

-- AddForeignKey
ALTER TABLE "planned_transaction_templates" ADD CONSTRAINT "planned_transaction_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transaction_templates" ADD CONSTRAINT "planned_transaction_templates_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transaction_templates" ADD CONSTRAINT "planned_transaction_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transaction_templates" ADD CONSTRAINT "planned_transaction_templates_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transaction_templates" ADD CONSTRAINT "planned_transaction_templates_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transactions" ADD CONSTRAINT "planned_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transactions" ADD CONSTRAINT "planned_transactions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "planned_transaction_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transactions" ADD CONSTRAINT "planned_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transactions" ADD CONSTRAINT "planned_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transactions" ADD CONSTRAINT "planned_transactions_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_transactions" ADD CONSTRAINT "planned_transactions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matched_transactions" ADD CONSTRAINT "matched_transactions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
