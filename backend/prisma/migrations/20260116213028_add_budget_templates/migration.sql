-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "isCustomized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "budget_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "periodType" "BudgetPeriod" NOT NULL,
    "includeSubcategories" BOOLEAN NOT NULL DEFAULT false,
    "startYear" INTEGER NOT NULL,
    "startNumber" INTEGER NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_templates_userId_idx" ON "budget_templates"("userId");

-- CreateIndex
CREATE INDEX "budget_templates_categoryId_idx" ON "budget_templates"("categoryId");

-- CreateIndex
CREATE INDEX "budget_templates_isActive_idx" ON "budget_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "budget_templates_userId_name_key" ON "budget_templates"("userId", "name");

-- CreateIndex
CREATE INDEX "budgets_templateId_idx" ON "budgets"("templateId");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "budget_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_templates" ADD CONSTRAINT "budget_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_templates" ADD CONSTRAINT "budget_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
