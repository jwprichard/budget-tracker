-- CreateTable
CREATE TABLE "AkahuConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3) NOT NULL,
    "consentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AkahuConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AkahuAccount" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "akahuAccountId" TEXT NOT NULL,
    "localAccountId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "accountNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSync" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AkahuAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AkahuTransaction" (
    "id" TEXT NOT NULL,
    "akahuAccountId" TEXT NOT NULL,
    "akahuTransactionId" TEXT NOT NULL,
    "localTransactionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "merchant" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "balance" DECIMAL(15,2),
    "rawData" JSONB,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AkahuTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "accountsSynced" INTEGER NOT NULL DEFAULT 0,
    "transactionsSynced" INTEGER NOT NULL DEFAULT 0,
    "duplicatesFound" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AkahuConnection_userId_idx" ON "AkahuConnection"("userId");

-- CreateIndex
CREATE INDEX "AkahuConnection_consentId_idx" ON "AkahuConnection"("consentId");

-- CreateIndex
CREATE INDEX "AkahuConnection_isActive_idx" ON "AkahuConnection"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AkahuAccount_akahuAccountId_key" ON "AkahuAccount"("akahuAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AkahuAccount_localAccountId_key" ON "AkahuAccount"("localAccountId");

-- CreateIndex
CREATE INDEX "AkahuAccount_connectionId_idx" ON "AkahuAccount"("connectionId");

-- CreateIndex
CREATE INDEX "AkahuAccount_akahuAccountId_idx" ON "AkahuAccount"("akahuAccountId");

-- CreateIndex
CREATE INDEX "AkahuAccount_localAccountId_idx" ON "AkahuAccount"("localAccountId");

-- CreateIndex
CREATE INDEX "AkahuAccount_syncEnabled_idx" ON "AkahuAccount"("syncEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "AkahuTransaction_akahuTransactionId_key" ON "AkahuTransaction"("akahuTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "AkahuTransaction_localTransactionId_key" ON "AkahuTransaction"("localTransactionId");

-- CreateIndex
CREATE INDEX "AkahuTransaction_akahuAccountId_idx" ON "AkahuTransaction"("akahuAccountId");

-- CreateIndex
CREATE INDEX "AkahuTransaction_akahuTransactionId_idx" ON "AkahuTransaction"("akahuTransactionId");

-- CreateIndex
CREATE INDEX "AkahuTransaction_localTransactionId_idx" ON "AkahuTransaction"("localTransactionId");

-- CreateIndex
CREATE INDEX "AkahuTransaction_date_idx" ON "AkahuTransaction"("date");

-- CreateIndex
CREATE INDEX "AkahuTransaction_isDuplicate_idx" ON "AkahuTransaction"("isDuplicate");

-- CreateIndex
CREATE INDEX "AkahuTransaction_needsReview_idx" ON "AkahuTransaction"("needsReview");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SyncJob_connectionId_idx" ON "SyncJob"("connectionId");

-- CreateIndex
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");

-- CreateIndex
CREATE INDEX "SyncJob_startedAt_idx" ON "SyncJob"("startedAt");

-- AddForeignKey
ALTER TABLE "AkahuAccount" ADD CONSTRAINT "AkahuAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AkahuConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkahuAccount" ADD CONSTRAINT "AkahuAccount_localAccountId_fkey" FOREIGN KEY ("localAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkahuTransaction" ADD CONSTRAINT "AkahuTransaction_akahuAccountId_fkey" FOREIGN KEY ("akahuAccountId") REFERENCES "AkahuAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkahuTransaction" ADD CONSTRAINT "AkahuTransaction_localTransactionId_fkey" FOREIGN KEY ("localTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
