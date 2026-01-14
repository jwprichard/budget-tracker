/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `BankConnection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Drop old User table (placeholder)
DROP TABLE IF EXISTS "User";

-- Step 2: Create new users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create default user
INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
VALUES (
    'default-user-00000000-0000-0000-0000-000000000001',
    'admin@localhost',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7BlNUbqZ0W', -- 'changeme123' hashed with bcrypt (12 rounds)
    'Default User',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 4: Add userId columns as NULLABLE first (to accommodate existing data)
ALTER TABLE "Account" ADD COLUMN "userId" TEXT;
ALTER TABLE "BankConnection" ADD COLUMN "userId" TEXT;
ALTER TABLE "Category" ADD COLUMN "userId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "userId" TEXT;

-- Step 5: Backfill existing data with default user ID
UPDATE "Account" SET "userId" = 'default-user-00000000-0000-0000-0000-000000000001' WHERE "userId" IS NULL;
UPDATE "BankConnection" SET "userId" = 'default-user-00000000-0000-0000-0000-000000000001' WHERE "userId" IS NULL;
UPDATE "Transaction" SET "userId" = 'default-user-00000000-0000-0000-0000-000000000001' WHERE "userId" IS NULL;
-- Category.userId remains nullable (for system categories)

-- Step 6: Make userId columns NOT NULL (except Category)
ALTER TABLE "Account" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "BankConnection" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;

-- Step 7: Create indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "BankConnection_userId_idx" ON "BankConnection"("userId");
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- Step 8: Add foreign key constraints
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
