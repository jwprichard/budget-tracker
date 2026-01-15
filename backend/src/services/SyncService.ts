import { IBankingDataProvider } from '../interfaces/IBankingDataProvider';
import { DuplicateDetectionService } from './DuplicateDetectionService';
import { TransactionMappingService } from './TransactionMappingService';
import { CategorizationService } from './CategorizationService';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Sync options
 */
export interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
  forceFull?: boolean;
}

/**
 * Sync result summary
 */
export interface SyncResult {
  syncHistoryId: string;
  accountsSynced: number;
  transactionsFetched: number;
  transactionsImported: number;
  duplicatesDetected: number;
  needsReview: number;
  errors: string[];
}

/**
 * Sync Service
 *
 * Core sync orchestration service - completely provider-agnostic.
 * Works with any IBankingDataProvider implementation (Akahu, Plaid, TrueLayer, etc.)
 *
 * Responsibilities:
 * - Orchestrate sync process
 * - Fetch accounts and transactions from provider
 * - Detect duplicates
 * - Import new transactions
 * - Track sync history
 * - Handle errors gracefully
 */
export class SyncService {
  private provider: IBankingDataProvider;
  private duplicateDetection: DuplicateDetectionService;
  private transactionMapping: TransactionMappingService;

  constructor(
    provider: IBankingDataProvider,
    duplicateDetection: DuplicateDetectionService = new DuplicateDetectionService(),
    categorizationService: CategorizationService = new CategorizationService(prisma),
    transactionMapping: TransactionMappingService = new TransactionMappingService(categorizationService)
  ) {
    this.provider = provider;
    this.duplicateDetection = duplicateDetection;
    this.transactionMapping = transactionMapping;
  }

  /**
   * Utility: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Trigger sync for a bank connection
   *
   * @param connectionId - Database ID of BankConnection
   * @param options - Sync options (date range, force full sync)
   * @returns Sync result summary
   */
  async syncConnection(connectionId: string, options?: SyncOptions): Promise<SyncResult> {
    // Create sync history record
    const syncHistory = await prisma.syncHistory.create({
      data: {
        connectionId,
        type: options?.forceFull ? 'FULL' : 'INCREMENTAL',
        status: 'IN_PROGRESS',
      },
    });

    const result: SyncResult = {
      syncHistoryId: syncHistory.id,
      accountsSynced: 0,
      transactionsFetched: 0,
      transactionsImported: 0,
      duplicatesDetected: 0,
      needsReview: 0,
      errors: [],
    };

    try {
      logger.info('[SyncService] Starting sync', {
        connectionId,
        syncHistoryId: syncHistory.id,
        provider: this.provider.getProviderName(),
        options,
      });

      // Step 1: Test connection
      const connectionStatus = await this.provider.testConnection(connectionId);
      if (!connectionStatus.isValid) {
        throw new Error(`Connection test failed: ${connectionStatus.error}`);
      }

      logger.info('[SyncService] Connection test passed', { connectionId });

      // Step 2: Fetch and sync accounts
      await this.syncAccounts(connectionId, result);

      // Step 3: Fetch and sync transactions for each linked account
      const linkedAccounts = await prisma.linkedAccount.findMany({
        where: {
          connectionId,
          syncEnabled: true,
          localAccountId: { not: null },
        },
      });

      logger.info('[SyncService] Found linked accounts', {
        connectionId,
        count: linkedAccounts.length,
      });

      for (let i = 0; i < linkedAccounts.length; i++) {
        const linkedAccount = linkedAccounts[i];
        try {
          await this.syncAccountTransactions(linkedAccount, options, result);

          // Add delay between accounts to avoid rate limiting (except after last account)
          if (i < linkedAccounts.length - 1) {
            logger.debug('[SyncService] Waiting before next account to avoid rate limits');
            await this.delay(1000); // 1 second delay between accounts
          }
        } catch (error) {
          const errorMsg = `Account ${linkedAccount?.externalName ?? 'Uknown Account'}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          logger.error('[SyncService] Failed to sync account', {
            linkedAccountId: linkedAccount?.id ?? 'Uknown Account',
            error,
          });
          result.errors.push(errorMsg);
        }
      }

      // Step 4: Update sync history
      await prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          accountsSynced: result.accountsSynced,
          transactionsFetched: result.transactionsFetched,
          transactionsImported: result.transactionsImported,
          duplicatesDetected: result.duplicatesDetected,
          needsReview: result.needsReview,
        },
      });

      // Step 5: Update connection last sync
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastSync: new Date(),
          lastError: result.errors.length > 0 ? result.errors.join('; ') : null,
        },
      });

      logger.info('[SyncService] Sync completed', {
        connectionId,
        syncHistoryId: syncHistory.id,
        result,
      });

      return result;
    } catch (error) {
      logger.error('[SyncService] Sync failed', { connectionId, error });

      await prisma.syncHistory.update({
        where: { id: syncHistory.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorDetails: error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { error: String(error) },
        },
      });

      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Sync accounts from provider
   * Private helper method
   *
   * @param connectionId - Database ID of BankConnection
   * @param result - Sync result to update
   */
  private async syncAccounts(connectionId: string, result: SyncResult): Promise<void> {
    logger.info('[SyncService] Syncing accounts', { connectionId });

    const externalAccounts = await this.provider.fetchAccounts(connectionId);

    logger.info('[SyncService] Fetched external accounts', {
      connectionId,
      count: externalAccounts.length,
    });

    for (const extAccount of externalAccounts) {
      // Upsert linked account
      await prisma.linkedAccount.upsert({
        where: {
          connectionId_externalAccountId: {
            connectionId,
            externalAccountId: extAccount.externalAccountId,
          },
        },
        update: {
          externalName: extAccount.name,
          externalType: extAccount.type,
          institution: extAccount.institution,
          accountNumber: extAccount.accountNumber,
          status: extAccount.status,
          lastSync: new Date(),
        },
        create: {
          connectionId,
          externalAccountId: extAccount.externalAccountId,
          externalName: extAccount.name,
          externalType: extAccount.type,
          institution: extAccount.institution,
          accountNumber: extAccount.accountNumber,
          status: extAccount.status,
          syncEnabled: true,
        },
      });

      result.accountsSynced++;
    }

    logger.info('[SyncService] Accounts synced', {
      connectionId,
      count: result.accountsSynced,
    });
  }

  /**
   * Sync transactions for a specific linked account
   * Private helper method
   *
   * @param linkedAccount - LinkedAccount to sync
   * @param options - Sync options
   * @param result - Sync result to update
   */
  private async syncAccountTransactions(
    linkedAccount: any,
    options: SyncOptions | undefined,
    result: SyncResult
  ): Promise<void> {
    logger.info('[SyncService] Syncing transactions', {
      linkedAccountId: linkedAccount.id,
      externalAccountId: linkedAccount.externalAccountId,
    });

    // Determine date range
    const isFirstSync = !linkedAccount.lastSync;
    const defaultDaysBack = isFirstSync ? 7 : 1; // First sync: 7 days, subsequent: 1 day back

    let startDate: Date;
    if (options?.startDate) {
      // Use explicit start date if provided
      startDate = options.startDate;
    } else if (linkedAccount.lastSync) {
      // Go back 1 day from last sync to ensure we don't miss transactions
      const lastSyncTime = new Date(linkedAccount.lastSync).getTime();
      startDate = new Date(lastSyncTime - 1 * 24 * 60 * 60 * 1000);
    } else {
      // First sync: go back 7 days
      startDate = new Date(Date.now() - defaultDaysBack * 24 * 60 * 60 * 1000);
    }

    const endDate = options?.endDate || new Date();

    logger.info('[SyncService] Fetching transactions', {
      linkedAccountId: linkedAccount.id,
      externalAccountId: linkedAccount.externalAccountId,
      isFirstSync,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dayRange: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
    });

    // Fetch transactions from provider
    const externalTransactions = await this.provider.fetchAllTransactions(
      linkedAccount.connectionId,
      linkedAccount.externalAccountId,
      { startDate, endDate }
    );

    result.transactionsFetched += externalTransactions.length;

    logger.info('[SyncService] Fetched external transactions', {
      linkedAccountId: linkedAccount.id,
      count: externalTransactions.length,
    });

    // Process each transaction
    for (const extTx of externalTransactions) {
      try {
        await this.processTransaction(linkedAccount, extTx, result);
      } catch (error) {
        const errorMsg = `Transaction ${extTx.externalTransactionId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        logger.error('[SyncService] Failed to process transaction', {
          externalTransactionId: extTx.externalTransactionId,
          error,
        });
        result.errors.push(errorMsg);
      }
    }

    // Update linked account last sync
    await prisma.linkedAccount.update({
      where: { id: linkedAccount.id },
      data: { lastSync: new Date() },
    });

    logger.info('[SyncService] Transactions synced for account', {
      linkedAccountId: linkedAccount.id,
      fetched: externalTransactions.length,
    });

    // Reconcile balance: Update local account balance to match external balance
    if (linkedAccount.localAccountId) {
      await this.reconcileBalance(linkedAccount.connectionId, linkedAccount.externalAccountId, linkedAccount.localAccountId);
    }
  }

  /**
   * Process a single external transaction
   * Private helper method
   *
   * @param linkedAccount - LinkedAccount this transaction belongs to
   * @param extTx - External transaction from provider
   * @param result - Sync result to update
   */
  private async processTransaction(
    linkedAccount: any,
    extTx: any,
    result: SyncResult
  ): Promise<void> {
    // Check if already imported
    const existing = await prisma.externalTransaction.findUnique({
      where: { externalTransactionId: extTx.externalTransactionId },
    });

    if (existing) {
      // Already imported, skip
      logger.debug('[SyncService] Transaction already imported, skipping', {
        externalTransactionId: extTx.externalTransactionId,
      });
      return;
    }

	logger.debug('[SyncService] External Transaction', {
		externalTransaction: extTx
	})

    // Create external transaction record
    const externalTransaction = await prisma.externalTransaction.create({
      data: {
        linkedAccountId: linkedAccount.id,
        externalTransactionId: extTx.externalTransactionId,
        date: extTx.date,
        amount: extTx.amount,
        description: extTx.description,
        merchant: extTx.merchant,
        category: extTx.rawData?.category?.name, // Category is nested in rawData
        type: extTx.type,
        balance: extTx.balance,
        rawData: extTx.rawData,
      },
    });

    logger.debug('[SyncService] Created external transaction record', {
      externalTransactionId: extTx.externalTransactionId,
	  externalTransaction: externalTransaction
    });

    // Duplicate detection
    const duplicates = await this.duplicateDetection.findDuplicates(
      {
        date: extTx.date,
        amount: extTx.amount,
        description: extTx.description,
      },
      linkedAccount.localAccountId
    );

    const bestMatch = duplicates[0];
    if (bestMatch) {
      logger.info('[SyncService] Found potential duplicates', {
        externalTransactionId: extTx.externalTransactionId,
        matchCount: duplicates.length,
        bestMatchConfidence: bestMatch.confidence,
      });

      if (bestMatch.confidence >= 95) {
        // High confidence - auto-link
        await this.linkTransaction(externalTransaction.id, bestMatch.transactionId);
        result.transactionsImported++;
        logger.info('[SyncService] Auto-linked high-confidence duplicate', {
          externalTransactionId: extTx.externalTransactionId,
          localTransactionId: bestMatch.transactionId,
          confidence: bestMatch.confidence,
        });
      } else if (bestMatch.confidence >= 70) {
        // Medium confidence - flag for review
        await prisma.externalTransaction.update({
          where: { id: externalTransaction.id },
          data: {
            isDuplicate: true,
            duplicateConfidence: bestMatch.confidence,
            needsReview: true,
          },
        });
        result.needsReview++;
        logger.info('[SyncService] Flagged for review (medium confidence)', {
          externalTransactionId: extTx.externalTransactionId,
          confidence: bestMatch.confidence,
        });
      } else {
        // Low confidence - create new transaction
        await this.importAsNewTransaction(linkedAccount, externalTransaction);
        result.transactionsImported++;
        logger.info('[SyncService] Imported as new (low confidence match)', {
          externalTransactionId: extTx.externalTransactionId,
          confidence: bestMatch.confidence,
        });
      }

      result.duplicatesDetected++;
    } else {
      // No duplicates - import as new transaction
      await this.importAsNewTransaction(linkedAccount, externalTransaction);
      result.transactionsImported++;
      logger.debug('[SyncService] Imported as new (no duplicates)', {
        externalTransactionId: extTx.externalTransactionId,
      });
    }
  }

  /**
   * Link external transaction to existing local transaction
   * Private helper method
   *
   * @param externalTransactionId - ID of ExternalTransaction
   * @param localTransactionId - ID of local Transaction
   */
  private async linkTransaction(
    externalTransactionId: string,
    localTransactionId: string
  ): Promise<void> {
    await prisma.externalTransaction.update({
      where: { id: externalTransactionId },
      data: {
        localTransactionId,
        isDuplicate: true,
      },
    });

    await prisma.transaction.update({
      where: { id: localTransactionId },
      data: { isFromBank: true },
    });

    logger.debug('[SyncService] Linked transactions', {
      externalTransactionId,
      localTransactionId,
    });
  }

  /**
   * Import external transaction as new local transaction
   * Private helper method
   *
   * @param linkedAccount - LinkedAccount this transaction belongs to
   * @param externalTransaction - ExternalTransaction to import
   */
  private async importAsNewTransaction(
    linkedAccount: any,
    externalTransaction: any
  ): Promise<void> {
    // Get userId from linked account's connection
    const connection = await prisma.bankConnection.findUnique({
      where: { id: linkedAccount.connectionId },
      select: { userId: true },
    });

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    // Map external transaction to local transaction format (with auto-categorization)
    const mappedTransaction = await this.transactionMapping.mapToLocalTransaction(
      {
        date: externalTransaction.date,
        amount: externalTransaction.amount,
        description: externalTransaction.description,
        merchant: externalTransaction.merchant,
        category: externalTransaction.category,
        type: externalTransaction.type,
        balance: externalTransaction.balance,
      },
      linkedAccount.localAccountId,
      connection.userId // Pass userId for categorization
    );

    // Create local transaction with userId
    const localTransaction = await prisma.transaction.create({
      data: {
        ...mappedTransaction,
        userId: connection.userId,
      },
    });

    // Link external transaction to local transaction
    await prisma.externalTransaction.update({
      where: { id: externalTransaction.id },
      data: { localTransactionId: localTransaction.id },
    });

    logger.debug('[SyncService] Imported new transaction', {
      externalTransactionId: externalTransaction.id,
      localTransactionId: localTransaction.id,
    });
  }

  /**
   * Reconcile local account balance with external account balance
   * Updates initialBalance so that current balance matches external balance
   * Private helper method
   *
   * @param connectionId - Database ID of BankConnection
   * @param externalAccountId - External account ID from provider
   * @param localAccountId - Local account ID
   */
  private async reconcileBalance(
    connectionId: string,
    externalAccountId: string,
    localAccountId: string
  ): Promise<void> {
    try {
      logger.info('[SyncService] Reconciling balance', {
        externalAccountId,
        localAccountId,
      });

      // Fetch external account to get current balance
      const externalAccounts = await this.provider.fetchAccounts(connectionId);
      const externalAccount = externalAccounts.find(
        (acc) => acc.externalAccountId === externalAccountId
      );

      if (!externalAccount || !externalAccount.balance) {
        logger.warn('[SyncService] No balance available from external account', {
          externalAccountId,
        });
        return;
      }

      const externalBalance = externalAccount.balance.current;

      // Calculate sum of all transactions for this account
      const transactionSum = await prisma.transaction.aggregate({
        where: { accountId: localAccountId },
        _sum: { amount: true },
      });

      const totalTransactions = transactionSum._sum.amount || 0;

      // Calculate required initial balance: externalBalance - sum(transactions)
      // This ensures: initialBalance + sum(transactions) = externalBalance
      const requiredInitialBalance = externalBalance - Number(totalTransactions);

      // Update local account initial balance
      await prisma.account.update({
        where: { id: localAccountId },
        data: { initialBalance: requiredInitialBalance },
      });

      logger.info('[SyncService] Balance reconciled', {
        externalAccountId,
        localAccountId,
        externalBalance,
        totalTransactions: Number(totalTransactions),
        requiredInitialBalance,
      });
    } catch (error) {
      logger.error('[SyncService] Failed to reconcile balance', {
        externalAccountId,
        localAccountId,
        error,
      });
      // Don't throw - balance reconciliation is not critical to sync success
    }
  }
}
