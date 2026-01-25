/**
 * PotentialTransfer Service
 * Handles detection and management of potential transfer pairs from bank sync
 */

import { PrismaClient, TransactionType } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

export interface PotentialTransferWithDetails {
  id: string;
  userId: string;
  sourceTransactionId: string;
  targetTransactionId: string;
  confidence: number;
  status: string;
  detectedAt: string;
  sourceAccountId: string;
  sourceAccountName: string;
  targetAccountId: string;
  targetAccountName: string;
  amount: number;
  date: string;
  sourceTransaction: {
    id: string;
    description: string;
    merchant: string | null;
    amount: number;
    date: string;
    accountName: string;
  };
  targetTransaction: {
    id: string;
    description: string;
    merchant: string | null;
    amount: number;
    date: string;
    accountName: string;
  };
}

export class PotentialTransferService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Detect potential transfers from recent transactions
   * Called after bank sync to identify matching debit/credit pairs
   */
  async detectPotentialTransfers(userId: string, daysBack: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get recent transactions that are not already part of a transfer
    // and not already in potential_transfers
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate },
        transferToAccountId: null, // Not already a transfer
        type: { in: ['INCOME', 'EXPENSE'] },
        // Exclude transactions already in potential transfers
        potentialTransferAsSource: null,
        potentialTransferAsTarget: null,
      },
      include: {
        account: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Separate into expenses (outgoing) and income (incoming)
    const expenses = transactions.filter((t) => t.type === 'EXPENSE' || Number(t.amount) < 0);
    const incomes = transactions.filter((t) => t.type === 'INCOME' || Number(t.amount) > 0);

    const potentialTransfers: Array<{
      sourceTransaction: typeof transactions[0];
      targetTransaction: typeof transactions[0];
      confidence: number;
    }> = [];

    // Match expenses with incomes
    for (const expense of expenses) {
      const expenseAmount = Math.abs(Number(expense.amount));
      const expenseDate = new Date(expense.date);

      for (const income of incomes) {
        // Skip if same account
        if (expense.accountId === income.accountId) continue;

        const incomeAmount = Math.abs(Number(income.amount));
        const incomeDate = new Date(income.date);

        // Check amount match (must be exact or very close)
        const amountDiff = Math.abs(expenseAmount - incomeAmount);
        if (amountDiff > 0.01) continue; // Amounts must match exactly

        // Check date proximity (within 3 days)
        const daysDiff = Math.abs(
          Math.floor((expenseDate.getTime() - incomeDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        if (daysDiff > 3) continue;

        // Calculate confidence score
        let confidence = 70; // Base confidence for matching amount

        // Exact date match
        if (daysDiff === 0) {
          confidence += 20;
        } else if (daysDiff === 1) {
          confidence += 10;
        }

        // Check for similar descriptions (transfer keywords)
        const transferKeywords = ['transfer', 'xfer', 'tfr', 'move', 'internal'];
        const expenseDesc = expense.description.toLowerCase();
        const incomeDesc = income.description.toLowerCase();

        if (transferKeywords.some((kw) => expenseDesc.includes(kw) || incomeDesc.includes(kw))) {
          confidence += 10;
        }

        // Cap confidence at 95
        confidence = Math.min(confidence, 95);

        potentialTransfers.push({
          sourceTransaction: expense,
          targetTransaction: income,
          confidence,
        });
      }
    }

    // Remove duplicates (same transaction matched multiple times)
    // Keep highest confidence match for each transaction
    const usedSourceIds = new Set<string>();
    const usedTargetIds = new Set<string>();
    const uniqueTransfers = potentialTransfers
      .sort((a, b) => b.confidence - a.confidence)
      .filter((pt) => {
        if (usedSourceIds.has(pt.sourceTransaction.id) || usedTargetIds.has(pt.targetTransaction.id)) {
          return false;
        }
        usedSourceIds.add(pt.sourceTransaction.id);
        usedTargetIds.add(pt.targetTransaction.id);
        return true;
      });

    // Create potential transfer records
    let created = 0;
    for (const pt of uniqueTransfers) {
      try {
        await this.prisma.potentialTransfer.create({
          data: {
            userId,
            sourceTransactionId: pt.sourceTransaction.id,
            targetTransactionId: pt.targetTransaction.id,
            confidence: pt.confidence,
            sourceAccountId: pt.sourceTransaction.accountId,
            sourceAccountName: pt.sourceTransaction.account.name,
            targetAccountId: pt.targetTransaction.accountId,
            targetAccountName: pt.targetTransaction.account.name,
            amount: Math.abs(Number(pt.sourceTransaction.amount)),
            date: pt.sourceTransaction.date,
            status: 'PENDING',
          },
        });
        created++;
      } catch (error) {
        // Skip if already exists (unique constraint)
        console.error('Error creating potential transfer:', error);
      }
    }

    return created;
  }

  /**
   * Get pending potential transfers for review
   */
  async getPendingTransfers(userId: string): Promise<PotentialTransferWithDetails[]> {
    const transfers = await this.prisma.potentialTransfer.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        sourceTransaction: {
          include: {
            account: {
              select: { name: true },
            },
          },
        },
        targetTransaction: {
          include: {
            account: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    return transfers.map((t) => ({
      id: t.id,
      userId: t.userId,
      sourceTransactionId: t.sourceTransactionId,
      targetTransactionId: t.targetTransactionId,
      confidence: t.confidence,
      status: t.status,
      detectedAt: t.detectedAt.toISOString(),
      sourceAccountId: t.sourceAccountId,
      sourceAccountName: t.sourceAccountName,
      targetAccountId: t.targetAccountId,
      targetAccountName: t.targetAccountName,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      sourceTransaction: {
        id: t.sourceTransaction.id,
        description: t.sourceTransaction.description,
        merchant: t.sourceTransaction.merchant,
        amount: Number(t.sourceTransaction.amount),
        date: t.sourceTransaction.date.toISOString(),
        accountName: t.sourceTransaction.account.name,
      },
      targetTransaction: {
        id: t.targetTransaction.id,
        description: t.targetTransaction.description,
        merchant: t.targetTransaction.merchant,
        amount: Number(t.targetTransaction.amount),
        date: t.targetTransaction.date.toISOString(),
        accountName: t.targetTransaction.account.name,
      },
    }));
  }

  /**
   * Get count of pending potential transfers
   */
  async getPendingCount(userId: string): Promise<number> {
    return this.prisma.potentialTransfer.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Confirm a potential transfer - combine into single TRANSFER transaction
   */
  async confirmTransfer(id: string, userId: string): Promise<{ transferId: string }> {
    const potentialTransfer = await this.prisma.potentialTransfer.findFirst({
      where: { id, userId },
      include: {
        sourceTransaction: true,
        targetTransaction: true,
      },
    });

    if (!potentialTransfer) {
      throw new AppError('Potential transfer not found', 404);
    }

    if (potentialTransfer.status !== 'PENDING') {
      throw new AppError('Potential transfer already processed', 400);
    }

    // Use a transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // First, mark potential transfer as confirmed (before deleting target transaction
      // which would CASCADE delete this record)
      await tx.potentialTransfer.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      });

      // Update the source transaction to be a TRANSFER
      const updatedSource = await tx.transaction.update({
        where: { id: potentialTransfer.sourceTransactionId },
        data: {
          type: 'TRANSFER' as TransactionType,
          transferToAccountId: potentialTransfer.targetAccountId,
          // Keep the negative amount (expense side of transfer)
        },
      });

      // Get the target transaction amount before deleting
      const targetAmount = Number(potentialTransfer.targetTransaction.amount);

      // Adjust the target account's initialBalance to compensate for removing the transaction
      // This maintains the correct balance (which should match the bank-reported balance)
      // The target transaction was an income (+), so we need to add it to initialBalance
      await tx.account.update({
        where: { id: potentialTransfer.targetAccountId },
        data: {
          initialBalance: {
            increment: targetAmount,
          },
        },
      });

      // Delete the target transaction (income side) since transfer handles both
      // Note: This will CASCADE delete the potential_transfer record, but we've already
      // updated its status above, and the record is no longer needed
      await tx.transaction.delete({
        where: { id: potentialTransfer.targetTransactionId },
      });

      return updatedSource;
    });

    return { transferId: result.id };
  }

  /**
   * Dismiss a potential transfer - keep as separate transactions
   */
  async dismissTransfer(id: string, userId: string): Promise<void> {
    const potentialTransfer = await this.prisma.potentialTransfer.findFirst({
      where: { id, userId },
    });

    if (!potentialTransfer) {
      throw new AppError('Potential transfer not found', 404);
    }

    if (potentialTransfer.status !== 'PENDING') {
      throw new AppError('Potential transfer already processed', 400);
    }

    await this.prisma.potentialTransfer.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });
  }
}
