import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reset all transactions (manual and bank-synced)
 * Deletes all Transaction and ExternalTransaction records
 */
export const resetTransactions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Delete in correct order to handle foreign keys
    await prisma.externalTransaction.deleteMany();
    await prisma.transaction.deleteMany();

    res.status(200).json({
      success: true,
      message: 'All transactions deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset all accounts
 * Deletes all accounts (which cascades to transactions)
 */
export const resetAccounts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Transactions will cascade delete
    await prisma.account.deleteMany();

    res.status(200).json({
      success: true,
      message: 'All accounts deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset bank connections and synced data
 * Deletes all bank connections, linked accounts, and external transactions
 */
export const resetBankConnections = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Delete in order: external transactions → linked accounts → connections
    await prisma.externalTransaction.deleteMany();
    await prisma.syncHistory.deleteMany();
    await prisma.linkedAccount.deleteMany();
    await prisma.bankConnection.deleteMany();

    // Update accounts to mark them as unlinked
    await prisma.account.updateMany({
      where: { isLinkedToBank: true },
      data: { isLinkedToBank: false, lastBankSync: null },
    });

    res.status(200).json({
      success: true,
      message: 'All bank connections deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset everything (nuclear option)
 * Deletes all data except categories (which are seed data)
 */
export const resetEverything = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Delete in correct order to handle foreign keys
    await prisma.externalTransaction.deleteMany();
    await prisma.syncHistory.deleteMany();
    await prisma.linkedAccount.deleteMany();
    await prisma.bankConnection.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    // Keep categories as they're seed data

    res.status(200).json({
      success: true,
      message: 'All data deleted successfully (categories preserved)',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get database statistics
 * Shows counts of records in each table
 */
export const getDatabaseStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      accountCount,
      transactionCount,
      categoryCount,
      bankConnectionCount,
      linkedAccountCount,
      externalTransactionCount,
      syncHistoryCount,
    ] = await Promise.all([
      prisma.account.count(),
      prisma.transaction.count(),
      prisma.category.count(),
      prisma.bankConnection.count(),
      prisma.linkedAccount.count(),
      prisma.externalTransaction.count(),
      prisma.syncHistory.count(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        accounts: accountCount,
        transactions: transactionCount,
        categories: categoryCount,
        bankConnections: bankConnectionCount,
        linkedAccounts: linkedAccountCount,
        externalTransactions: externalTransactionCount,
        syncHistory: syncHistoryCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
