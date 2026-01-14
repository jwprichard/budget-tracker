import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { SyncService } from '../services/SyncService';
import { BankingProviderFactory } from '../services/BankingProviderFactory';
import { DuplicateDetectionService } from '../services/DuplicateDetectionService';
import { TransactionMappingService } from '../services/TransactionMappingService';
import { encrypt } from '../utils/encryption';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Sync Controller
 *
 * Handles all sync-related API endpoints:
 * - Setup connection
 * - Trigger sync
 * - Get sync status/history
 * - Manage transactions needing review
 * - Link/unlink accounts
 */

/**
 * Test connection by calling /v1/me endpoint
 * POST /api/v1/sync/test
 */
export const testConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { connectionId } = req.body;

    logger.info('[SyncController] Testing connection', { connectionId, userId });

    // Get connection from database (must belong to user)
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    if (!connection.appToken || !connection.userToken) {
      res.status(400).json({ error: 'Connection missing required tokens' });
      return;
    }

    // Decrypt tokens
    const { decrypt } = await import('../utils/encryption');
    const appToken = decrypt(connection.appToken);
    const userToken = decrypt(connection.userToken);

    // Create provider and test
    const provider = await BankingProviderFactory.createProvider(connectionId);
    const { AkahuApiClient } = await import('../services/akahu/AkahuApiClient');
    const apiClient = new AkahuApiClient();

    const meData = await apiClient.testMe(appToken, userToken);

    logger.info('[SyncController] Connection test successful', { connectionId });

    res.json({
      success: true,
      connectionId: connection.id,
      provider: connection.provider,
      meData,
    });
  } catch (error) {
    logger.error('[SyncController] Connection test failed', { error });
    next(error);
  }
};

/**
 * Setup a new bank connection
 * POST /api/v1/sync/setup
 */
export const setupConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { provider, appToken, userToken, metadata } = req.body;

    logger.info('[SyncController] Setting up connection', { provider, userId });

    // Encrypt both tokens
    const encryptedAppToken = encrypt(appToken);
    const encryptedUserToken = encrypt(userToken);

    // Create bank connection
    const connection = await prisma.bankConnection.create({
      data: {
        userId,
        provider,
        appToken: encryptedAppToken,
        userToken: encryptedUserToken,
        status: 'ACTIVE',
        metadata,
      },
    });

    logger.info('[SyncController] Connection created', {
      connectionId: connection.id,
      provider: connection.provider,
    });

    res.status(201).json({
      connectionId: connection.id,
      provider: connection.provider,
      status: connection.status,
      createdAt: connection.createdAt,
    });
  } catch (error) {
    logger.error('[SyncController] Failed to setup connection', { error });
    next(error);
  }
};

/**
 * Link external account to local account
 * POST /api/v1/sync/link-account
 */
export const linkAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { linkedAccountId, localAccountId } = req.body;

    logger.info('[SyncController] Linking account', {
      linkedAccountId,
      localAccountId,
      userId,
    });

    // Verify local account belongs to user
    const localAccount = await prisma.account.findFirst({
      where: { id: localAccountId, userId },
    });

    if (!localAccount) {
      res.status(404).json({ error: 'Local account not found' });
      return;
    }

    // Check if this local account is already linked to another external account
    const existingLink = await prisma.linkedAccount.findUnique({
      where: { localAccountId },
      include: {
        localAccount: true,
      },
    });

    if (existingLink && existingLink.id !== linkedAccountId) {
      logger.warn('[SyncController] Local account already linked', {
        localAccountId,
        existingLinkedAccountId: existingLink.id,
        existingExternalAccountId: existingLink.externalAccountId,
      });
      res.status(400).json({
        error: {
          code: 'ACCOUNT_ALREADY_LINKED',
          message: `This account is already linked to "${existingLink.externalName}". Each local account can only be linked to one external account.`,
        },
      });
      return;
    }

    // Update linked account
    const linkedAccount = await prisma.linkedAccount.update({
      where: { id: linkedAccountId },
      data: { localAccountId },
      include: {
        localAccount: true,
      },
    });

    // Update local account
    await prisma.account.update({
      where: { id: localAccountId },
      data: {
        isLinkedToBank: true,
      },
    });

    logger.info('[SyncController] Account linked successfully', {
      linkedAccountId,
      localAccountId,
    });

    res.json({
      success: true,
      linkedAccount: {
        id: linkedAccount.id,
        externalName: linkedAccount.externalName,
        institution: linkedAccount.institution,
        localAccountId: linkedAccount.localAccountId,
        localAccountName: linkedAccount.localAccount?.name,
        syncEnabled: linkedAccount.syncEnabled,
      },
    });
  } catch (error) {
    logger.error('[SyncController] Failed to link account', { error });
    next(error);
  }
};

/**
 * Unlink external account from local account
 * POST /api/v1/sync/unlink-account
 */
export const unlinkAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { localAccountId } = req.body;

    logger.info('[SyncController] Unlinking account', {
      localAccountId,
      userId,
    });

    // Verify local account belongs to user
    const localAccount = await prisma.account.findFirst({
      where: { id: localAccountId, userId },
    });

    if (!localAccount) {
      res.status(404).json({ error: 'Local account not found' });
      return;
    }

    // Find the linked account by local account ID
    const linkedAccount = await prisma.linkedAccount.findUnique({
      where: { localAccountId },
    });

    if (!linkedAccount) {
      res.status(404).json({
        error: {
          code: 'LINKED_ACCOUNT_NOT_FOUND',
          message: 'No linked account found for this local account',
        },
      });
      return;
    }

    // Unlink: set localAccountId to null
    await prisma.linkedAccount.update({
      where: { id: linkedAccount.id },
      data: { localAccountId: null },
    });

    // Update local account
    await prisma.account.update({
      where: { id: localAccountId },
      data: {
        isLinkedToBank: false,
      },
    });

    logger.info('[SyncController] Account unlinked successfully', {
      linkedAccountId: linkedAccount.id,
      localAccountId,
    });

    res.json({
      success: true,
      message: 'Account unlinked successfully',
    });
  } catch (error) {
    logger.error('[SyncController] Failed to unlink account', { error });
    next(error);
  }
};

/**
 * Trigger sync for a connection
 * POST /api/v1/sync/trigger
 */
export const triggerSync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { connectionId, options } = req.body;

    logger.info('[SyncController] Triggering sync', { connectionId, options, userId });

    // Verify connection belongs to user
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    // Parse options
    const syncOptions = options
      ? {
          startDate: options.startDate ? new Date(options.startDate) : undefined,
          endDate: options.endDate ? new Date(options.endDate) : undefined,
          forceFull: options.forceFull,
        }
      : undefined;

    // Create provider
    const provider = await BankingProviderFactory.createProvider(connectionId);

    // Create sync service
    const syncService = new SyncService(
      provider,
      new DuplicateDetectionService(),
      new TransactionMappingService()
    );

    // Trigger sync (runs in background)
    // Note: In production, this should be queued as a background job
    syncService
      .syncConnection(connectionId, syncOptions)
      .then((result) => {
        logger.info('[SyncController] Sync completed', { connectionId, result });
      })
      .catch((error) => {
        logger.error('[SyncController] Sync failed', { connectionId, error });
      });

    // Return immediately with sync history ID
    // Client can poll for status
    const syncHistory = await prisma.syncHistory.findFirst({
      where: { connectionId },
      orderBy: { startedAt: 'desc' },
    });

    res.json({
      syncHistoryId: syncHistory?.id,
      status: 'IN_PROGRESS',
      startedAt: syncHistory?.startedAt,
    });
  } catch (error) {
    logger.error('[SyncController] Failed to trigger sync', { error });
    next(error);
  }
};

/**
 * Get sync status
 * GET /api/v1/sync/status/:syncHistoryId
 */
export const getSyncStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { syncHistoryId } = req.params;

    logger.debug('[SyncController] Getting sync status', { syncHistoryId, userId });

    // Get sync history and verify connection belongs to user
    const syncHistory = await prisma.syncHistory.findFirst({
      where: {
        id: syncHistoryId,
        connection: { userId },
      },
      include: { connection: true },
    });

    if (!syncHistory) {
      res.status(404).json({ error: 'Sync history not found' });
      return;
    }

    res.json({
      id: syncHistory.id,
      status: syncHistory.status,
      type: syncHistory.type,
      startedAt: syncHistory.startedAt,
      completedAt: syncHistory.completedAt,
      accountsSynced: syncHistory.accountsSynced,
      transactionsFetched: syncHistory.transactionsFetched,
      transactionsImported: syncHistory.transactionsImported,
      duplicatesDetected: syncHistory.duplicatesDetected,
      needsReview: syncHistory.needsReview,
      errorMessage: syncHistory.errorMessage,
    });
  } catch (error) {
    logger.error('[SyncController] Failed to get sync status', { error });
    next(error);
  }
};

/**
 * Get sync history
 * GET /api/v1/sync/history
 */
export const getSyncHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { connectionId, page = 1, pageSize = 20 } = req.query;

    logger.debug('[SyncController] Getting sync history', {
      connectionId,
      page,
      pageSize,
      userId,
    });

    const where = {
      connection: { userId },
      ...(connectionId ? { connectionId: connectionId as string } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.syncHistory.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.syncHistory.count({ where }),
    ]);

    res.json({
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
        accountsSynced: item.accountsSynced,
        transactionsFetched: item.transactionsFetched,
        transactionsImported: item.transactionsImported,
        duplicatesDetected: item.duplicatesDetected,
        needsReview: item.needsReview,
      })),
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    });
  } catch (error) {
    logger.error('[SyncController] Failed to get sync history', { error });
    next(error);
  }
};

/**
 * Get transactions for a specific sync history
 * GET /api/v1/sync/history/:syncHistoryId/transactions
 */
export const getSyncTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { syncHistoryId } = req.params;

    logger.debug('[SyncController] Getting sync transactions', { syncHistoryId, userId });

    // Get sync history and verify connection belongs to user
    const syncHistory = await prisma.syncHistory.findFirst({
      where: {
        id: syncHistoryId,
        connection: { userId },
      },
      include: {
        connection: {
          include: {
            linkedAccounts: {
              include: {
                localAccount: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!syncHistory) {
      res.status(404).json({ error: 'Sync history not found' });
      return;
    }

    // Get external transactions created during this sync
    // We'll query transactions created between sync start and completion (or now if not completed)
    const endTime = syncHistory.completedAt || new Date();
    const startTime = syncHistory.startedAt;

    const externalTransactions = await prisma.externalTransaction.findMany({
      where: {
        linkedAccount: {
          connectionId: syncHistory.connectionId,
        },
        createdAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        linkedAccount: {
          include: {
            localAccount: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        localTransaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            date: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      items: externalTransactions.map((tx) => ({
        id: tx.id,
        externalTransactionId: tx.externalTransactionId,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
        merchant: tx.merchant,
        category: tx.category,
        type: tx.type,
        balance: tx.balance,
        isDuplicate: tx.isDuplicate,
        duplicateConfidence: tx.duplicateConfidence,
        needsReview: tx.needsReview,
        linkedAccount: {
          id: tx.linkedAccount.id,
          externalName: tx.linkedAccount.externalName,
          institution: tx.linkedAccount.institution,
          localAccount: tx.linkedAccount.localAccount,
        },
        localTransaction: tx.localTransaction,
        createdAt: tx.createdAt,
      })),
      syncHistory: {
        id: syncHistory.id,
        type: syncHistory.type,
        status: syncHistory.status,
        startedAt: syncHistory.startedAt,
        completedAt: syncHistory.completedAt,
        transactionsFetched: syncHistory.transactionsFetched,
      },
    });
  } catch (error) {
    logger.error('[SyncController] Failed to get sync transactions', { error });
    next(error);
  }
};

/**
 * Get transactions needing review
 * GET /api/v1/sync/review
 */
export const getReviewTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { connectionId } = req.query;

    logger.debug('[SyncController] Getting review transactions', { connectionId, userId });

    const transactions = await prisma.externalTransaction.findMany({
      where: {
        needsReview: true,
        linkedAccount: {
          connectionId: connectionId as string,
          connection: { userId },
        },
      },
      include: {
        linkedAccount: {
          include: {
            localAccount: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // For each transaction, get potential duplicate
    const items = await Promise.all(
      transactions.map(async (tx) => {
        // Find the potential duplicate transaction
        let potentialDuplicate = null;

        if (tx.duplicateConfidence && tx.linkedAccount.localAccountId) {
          const duplicates = await prisma.transaction.findMany({
            where: {
              accountId: tx.linkedAccount.localAccountId,
              date: {
                gte: new Date(tx.date.getTime() - 2 * 24 * 60 * 60 * 1000),
                lte: new Date(tx.date.getTime() + 2 * 24 * 60 * 60 * 1000),
              },
              amount: tx.amount,
            },
            take: 1,
          });

          const duplicate = duplicates[0];
          if (duplicate) {
            potentialDuplicate = {
              id: duplicate.id,
              date: duplicate.date,
              description: duplicate.description,
              confidence: tx.duplicateConfidence,
            };
          }
        }

        return {
          id: tx.id,
          externalTransactionId: tx.externalTransactionId,
          date: tx.date,
          amount: tx.amount,
          description: tx.description,
          merchant: tx.merchant,
          category: tx.category,
          duplicateConfidence: tx.duplicateConfidence,
          potentialDuplicate,
          account: {
            externalName: tx.linkedAccount.externalName,
            localName: tx.linkedAccount.localAccount?.name,
          },
        };
      })
    );

    res.json({ items });
  } catch (error) {
    logger.error('[SyncController] Failed to get review transactions', { error });
    next(error);
  }
};

/**
 * Approve transaction (import as new)
 * POST /api/v1/sync/review/:externalTransactionId/approve
 */
export const approveTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { externalTransactionId } = req.params;

    logger.info('[SyncController] Approving transaction', { externalTransactionId, userId });

    // Get external transaction and verify it belongs to user's connection
    const externalTx = await prisma.externalTransaction.findFirst({
      where: {
        id: externalTransactionId,
        linkedAccount: {
          connection: { userId },
        },
      },
      include: {
        linkedAccount: true,
      },
    });

    if (!externalTx) {
      res.status(404).json({ error: 'External transaction not found' });
      return;
    }

    if (!externalTx.linkedAccount.localAccountId) {
      res.status(400).json({ error: 'Account not linked to local account' });
      return;
    }

    // Map and create local transaction
    const mappingService = new TransactionMappingService();
    const mappedTransaction = mappingService.mapToLocalTransaction(
      {
        date: externalTx.date,
        amount: Number(externalTx.amount),
        description: externalTx.description,
        merchant: externalTx.merchant || undefined,
        category: externalTx.category || undefined,
        type: externalTx.type,
        balance: externalTx.balance ? Number(externalTx.balance) : undefined,
      },
      externalTx.linkedAccount.localAccountId
    );

    const localTransaction = await prisma.transaction.create({
      data: {
        ...mappedTransaction,
        userId, // Add userId to transaction
      },
    });

    // Update external transaction
    await prisma.externalTransaction.update({
      where: { id: externalTransactionId },
      data: {
        localTransactionId: localTransaction.id,
        needsReview: false,
      },
    });

    logger.info('[SyncController] Transaction approved', {
      externalTransactionId,
      localTransactionId: localTransaction.id,
    });

    res.json({
      success: true,
      localTransaction: {
        id: localTransaction.id,
        date: localTransaction.date,
        amount: localTransaction.amount,
        description: localTransaction.description,
      },
    });
  } catch (error) {
    logger.error('[SyncController] Failed to approve transaction', { error });
    next(error);
  }
};

/**
 * Reject transaction (mark as duplicate, don't import)
 * POST /api/v1/sync/review/:externalTransactionId/reject
 */
export const rejectTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { externalTransactionId } = req.params;

    logger.info('[SyncController] Rejecting transaction', { externalTransactionId, userId });

    // Verify transaction belongs to user's connection
    const externalTx = await prisma.externalTransaction.findFirst({
      where: {
        id: externalTransactionId,
        linkedAccount: {
          connection: { userId },
        },
      },
    });

    if (!externalTx) {
      res.status(404).json({ error: 'External transaction not found' });
      return;
    }

    await prisma.externalTransaction.update({
      where: { id: externalTransactionId },
      data: {
        needsReview: false,
        isDuplicate: true,
      },
    });

    logger.info('[SyncController] Transaction rejected', { externalTransactionId });

    res.json({ success: true });
  } catch (error) {
    logger.error('[SyncController] Failed to reject transaction', { error });
    next(error);
  }
};

/**
 * Link transaction to existing local transaction
 * POST /api/v1/sync/review/:externalTransactionId/link
 */
export const linkTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { externalTransactionId } = req.params;
    const { localTransactionId } = req.body;

    logger.info('[SyncController] Linking transaction', {
      externalTransactionId,
      localTransactionId,
      userId,
    });

    // Verify external transaction belongs to user's connection
    const externalTx = await prisma.externalTransaction.findFirst({
      where: {
        id: externalTransactionId,
        linkedAccount: {
          connection: { userId },
        },
      },
    });

    if (!externalTx) {
      res.status(404).json({ error: 'External transaction not found' });
      return;
    }

    // Verify local transaction belongs to user
    const localTx = await prisma.transaction.findFirst({
      where: { id: localTransactionId, userId },
    });

    if (!localTx) {
      res.status(404).json({ error: 'Local transaction not found' });
      return;
    }

    // Update external transaction
    await prisma.externalTransaction.update({
      where: { id: externalTransactionId },
      data: {
        localTransactionId,
        needsReview: false,
        isDuplicate: true,
      },
    });

    // Update local transaction
    await prisma.transaction.update({
      where: { id: localTransactionId },
      data: { isFromBank: true },
    });

    logger.info('[SyncController] Transaction linked', {
      externalTransactionId,
      localTransactionId,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('[SyncController] Failed to link transaction', { error });
    next(error);
  }
};

/**
 * Get all bank connections
 * GET /api/v1/sync/connections
 */
export const getConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    logger.debug('[SyncController] Getting connections', { userId });

    const connections = await prisma.bankConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      items: connections.map((conn) => ({
        connectionId: conn.id,
        provider: conn.provider,
        status: conn.status,
        createdAt: conn.createdAt,
        lastSync: conn.lastSync,
        lastError: conn.lastError,
      })),
    });
  } catch (error) {
    logger.error('[SyncController] Failed to get connections', { error });
    next(error);
  }
};

/**
 * Get connected accounts
 * GET /api/v1/sync/accounts
 */
export const getConnectedAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { connectionId } = req.query;

    logger.debug('[SyncController] Getting connected accounts', { connectionId, userId });

    // Verify connection belongs to user
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId as string, userId },
    });

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    const accounts = await prisma.linkedAccount.findMany({
      where: { connectionId: connectionId as string },
      include: {
        localAccount: true,
      },
      orderBy: { externalName: 'asc' },
    });

    res.json({
      items: accounts.map((acc) => ({
        id: acc.id,
        externalAccountId: acc.externalAccountId,
        externalName: acc.externalName,
        externalType: acc.externalType,
        institution: acc.institution,
        accountNumber: acc.accountNumber,
        localAccount: acc.localAccount
          ? {
              id: acc.localAccount.id,
              name: acc.localAccount.name,
              type: acc.localAccount.type,
            }
          : null,
        syncEnabled: acc.syncEnabled,
        lastSync: acc.lastSync,
      })),
    });
  } catch (error) {
    logger.error('[SyncController] Failed to get connected accounts', { error });
    next(error);
  }
};
