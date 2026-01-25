-- Add accountId column to budgets table
ALTER TABLE "budgets" ADD COLUMN "accountId" TEXT;

-- Add accountId column to budget_templates table
ALTER TABLE "budget_templates" ADD COLUMN "accountId" TEXT;

-- Add foreign key constraint for budgets.accountId
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key constraint for budget_templates.accountId
ALTER TABLE "budget_templates" ADD CONSTRAINT "budget_templates_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for budgets.accountId
CREATE INDEX "budgets_accountId_idx" ON "budgets"("accountId");

-- Create index for budget_templates.accountId
CREATE INDEX "budget_templates_accountId_idx" ON "budget_templates"("accountId");
