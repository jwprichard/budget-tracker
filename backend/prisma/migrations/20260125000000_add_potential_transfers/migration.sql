-- CreateTable
CREATE TABLE "potential_transfers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceTransactionId" TEXT NOT NULL,
    "targetTransactionId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourceAccountId" TEXT NOT NULL,
    "sourceAccountName" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "targetAccountName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "potential_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "potential_transfers_sourceTransactionId_key" ON "potential_transfers"("sourceTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "potential_transfers_targetTransactionId_key" ON "potential_transfers"("targetTransactionId");

-- CreateIndex
CREATE INDEX "potential_transfers_userId_idx" ON "potential_transfers"("userId");

-- CreateIndex
CREATE INDEX "potential_transfers_status_idx" ON "potential_transfers"("status");

-- CreateIndex
CREATE INDEX "potential_transfers_detectedAt_idx" ON "potential_transfers"("detectedAt");

-- AddForeignKey
ALTER TABLE "potential_transfers" ADD CONSTRAINT "potential_transfers_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potential_transfers" ADD CONSTRAINT "potential_transfers_targetTransactionId_fkey" FOREIGN KEY ("targetTransactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
