/*
  Warnings:

  - You are about to drop the `AkahuAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AkahuConnection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AkahuTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AkahuAccount" DROP CONSTRAINT "AkahuAccount_connectionId_fkey";

-- DropForeignKey
ALTER TABLE "AkahuAccount" DROP CONSTRAINT "AkahuAccount_localAccountId_fkey";

-- DropForeignKey
ALTER TABLE "AkahuTransaction" DROP CONSTRAINT "AkahuTransaction_akahuAccountId_fkey";

-- DropForeignKey
ALTER TABLE "AkahuTransaction" DROP CONSTRAINT "AkahuTransaction_localTransactionId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isLinkedToBank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastBankSync" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isFromBank" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "AkahuAccount";

-- DropTable
DROP TABLE "AkahuConnection";

-- DropTable
DROP TABLE "AkahuTransaction";

-- DropTable
DROP TABLE "SyncJob";

-- DropTable
DROP TABLE "WebhookEvent";

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'AKAHU_PERSONAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSync" TIMESTAMP(3),
    "lastError" TEXT,
    "appToken" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedAccount" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "externalName" TEXT NOT NULL,
    "externalType" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "accountNumber" TEXT,
    "localAccountId" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalTransaction" (
    "id" TEXT NOT NULL,
    "linkedAccountId" TEXT NOT NULL,
    "externalTransactionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(15,2),
    "localTransactionId" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateConfidence" INTEGER,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncHistory" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "accountsSynced" INTEGER NOT NULL DEFAULT 0,
    "transactionsFetched" INTEGER NOT NULL DEFAULT 0,
    "transactionsImported" INTEGER NOT NULL DEFAULT 0,
    "duplicatesDetected" INTEGER NOT NULL DEFAULT 0,
    "needsReview" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankConnection_provider_idx" ON "BankConnection"("provider");

-- CreateIndex
CREATE INDEX "BankConnection_status_idx" ON "BankConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedAccount_localAccountId_key" ON "LinkedAccount"("localAccountId");

-- CreateIndex
CREATE INDEX "LinkedAccount_connectionId_idx" ON "LinkedAccount"("connectionId");

-- CreateIndex
CREATE INDEX "LinkedAccount_externalAccountId_idx" ON "LinkedAccount"("externalAccountId");

-- CreateIndex
CREATE INDEX "LinkedAccount_localAccountId_idx" ON "LinkedAccount"("localAccountId");

-- CreateIndex
CREATE INDEX "LinkedAccount_syncEnabled_idx" ON "LinkedAccount"("syncEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedAccount_connectionId_externalAccountId_key" ON "LinkedAccount"("connectionId", "externalAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTransaction_externalTransactionId_key" ON "ExternalTransaction"("externalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTransaction_localTransactionId_key" ON "ExternalTransaction"("localTransactionId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_linkedAccountId_idx" ON "ExternalTransaction"("linkedAccountId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_externalTransactionId_idx" ON "ExternalTransaction"("externalTransactionId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_localTransactionId_idx" ON "ExternalTransaction"("localTransactionId");

-- CreateIndex
CREATE INDEX "ExternalTransaction_date_idx" ON "ExternalTransaction"("date");

-- CreateIndex
CREATE INDEX "ExternalTransaction_isDuplicate_idx" ON "ExternalTransaction"("isDuplicate");

-- CreateIndex
CREATE INDEX "ExternalTransaction_needsReview_idx" ON "ExternalTransaction"("needsReview");

-- CreateIndex
CREATE INDEX "SyncHistory_connectionId_idx" ON "SyncHistory"("connectionId");

-- CreateIndex
CREATE INDEX "SyncHistory_status_idx" ON "SyncHistory"("status");

-- CreateIndex
CREATE INDEX "SyncHistory_startedAt_idx" ON "SyncHistory"("startedAt");

-- AddForeignKey
ALTER TABLE "LinkedAccount" ADD CONSTRAINT "LinkedAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedAccount" ADD CONSTRAINT "LinkedAccount_localAccountId_fkey" FOREIGN KEY ("localAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalTransaction" ADD CONSTRAINT "ExternalTransaction_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "LinkedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalTransaction" ADD CONSTRAINT "ExternalTransaction_localTransactionId_fkey" FOREIGN KEY ("localTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncHistory" ADD CONSTRAINT "SyncHistory_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
