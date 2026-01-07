import {
  IBankingDataProvider,
  ConnectionStatus,
  ExternalAccount,
  ExternalTransaction,
  PaginatedTransactions,
  FetchTransactionsOptions,
} from '../../interfaces/IBankingDataProvider';
import { AkahuApiClient, AkahuAccount, AkahuTransaction } from './AkahuApiClient';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';

// Use existing prisma instance or create new one
// In production, this should be imported from a shared prisma instance
const prisma = new PrismaClient();

/**
 * Akahu Personal App Provider
 *
 * Implements IBankingDataProvider for Akahu Personal App tier.
 * Uses app token authentication (no OAuth required).
 *
 * This implementation can be swapped for AkahuOAuthProvider later
 * without changing any upstream code that uses IBankingDataProvider.
 */
export class AkahuPersonalProvider implements IBankingDataProvider {
  private apiClient: AkahuApiClient;

  constructor() {
    this.apiClient = new AkahuApiClient();
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'AKAHU_PERSONAL';
  }

  /**
   * Test if connection is valid
   *
   * @param connectionId - Database ID of BankConnection
   * @returns Connection status
   */
  async testConnection(connectionId: string): Promise<ConnectionStatus> {
    try {
      logger.info('[AkahuPersonalProvider] Testing connection', { connectionId });

      const connection = await prisma.bankConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection || !connection.appToken || !connection.userToken) {
        return {
          isValid: false,
          error: 'Connection not found or missing tokens',
          lastChecked: new Date(),
        };
      }

      // Decrypt both tokens
      const appToken = decrypt(connection.appToken);
      const userToken = decrypt(connection.userToken);

      // Test connection by fetching accounts
      await this.apiClient.getAccounts(appToken, userToken);

      logger.info('[AkahuPersonalProvider] Connection test successful', { connectionId });

      return {
        isValid: true,
        lastChecked: new Date(),
      };
    } catch (error) {
      logger.error('[AkahuPersonalProvider] Connection test failed', { connectionId, error });

      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Fetch all accounts from Akahu
   *
   * @param connectionId - Database ID of BankConnection
   * @returns Array of external accounts
   */
  async fetchAccounts(connectionId: string): Promise<ExternalAccount[]> {
    try {
      logger.info('[AkahuPersonalProvider] Fetching accounts', { connectionId });

      const connection = await this.getConnection(connectionId);
      const appToken = decrypt(connection.appToken!);
      const userToken = decrypt(connection.userToken!);

      const akahuAccounts = await this.apiClient.getAccounts(appToken, userToken);

      const externalAccounts = akahuAccounts.map((acc) => this.mapAccount(acc));

      logger.info(`[AkahuPersonalProvider] Fetched ${externalAccounts.length} accounts`, {
        connectionId,
      });

      return externalAccounts;
    } catch (error) {
      logger.error('[AkahuPersonalProvider] Failed to fetch accounts', { connectionId, error });
      throw error;
    }
  }

  /**
   * Fetch transactions for an account with pagination
   *
   * @param connectionId - Database ID of BankConnection
   * @param externalAccountId - Akahu account ID
   * @param options - Filter and pagination options
   * @returns Paginated transaction response
   */
  async fetchTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: FetchTransactionsOptions
  ): Promise<PaginatedTransactions> {
    try {
      logger.info('[AkahuPersonalProvider] Fetching transactions', {
        connectionId,
        externalAccountId,
        options,
      });

      const connection = await this.getConnection(connectionId);
      const appToken = decrypt(connection.appToken!);
      const userToken = decrypt(connection.userToken!);

      const result = await this.apiClient.getTransactions(appToken, userToken, externalAccountId, {
        start: options?.startDate,
        end: options?.endDate,
        cursor: options?.cursor,
      });

      const externalTransactions = result.items.map((tx) => this.mapTransaction(tx));

      logger.info(`[AkahuPersonalProvider] Fetched ${externalTransactions.length} transactions`, {
        connectionId,
        externalAccountId,
      });

      return {
        transactions: externalTransactions,
        cursor: result.cursor?.next,
        hasMore: !!result.cursor?.next,
      };
    } catch (error) {
      logger.error('[AkahuPersonalProvider] Failed to fetch transactions', {
        connectionId,
        externalAccountId,
        error,
      });
      throw error;
    }
  }

  /**
   * Fetch all transactions with automatic pagination
   *
   * @param connectionId - Database ID of BankConnection
   * @param externalAccountId - Akahu account ID
   * @param options - Filter options
   * @returns Array of all transactions
   */
  async fetchAllTransactions(
    connectionId: string,
    externalAccountId: string,
    options?: Pick<FetchTransactionsOptions, 'startDate' | 'endDate'>
  ): Promise<ExternalTransaction[]> {
    try {
      logger.info('[AkahuPersonalProvider] Fetching all transactions', {
        connectionId,
        externalAccountId,
        options,
      });

      const connection = await this.getConnection(connectionId);
      const appToken = decrypt(connection.appToken!);
      const userToken = decrypt(connection.userToken!);

      const allTransactions = await this.apiClient.getAllTransactions(
        appToken,
        userToken,
        externalAccountId,
        {
          start: options?.startDate,
          end: options?.endDate,
        }
      );

      const externalTransactions = allTransactions.map((tx) => this.mapTransaction(tx));

      logger.info(`[AkahuPersonalProvider] Fetched total of ${externalTransactions.length} transactions`, {
        connectionId,
        externalAccountId,
      });

      return externalTransactions;
    } catch (error) {
      logger.error('[AkahuPersonalProvider] Failed to fetch all transactions', {
        connectionId,
        externalAccountId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get connection from database
   * Private helper method
   *
   * @param connectionId - Database ID of BankConnection
   * @returns BankConnection record
   */
  private async getConnection(connectionId: string) {
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    if (!connection.appToken) {
      throw new Error('App token not configured for connection');
    }

    if (!connection.userToken) {
      throw new Error('User token not configured for connection');
    }

    return connection;
  }

  /**
   * Map Akahu account to ExternalAccount
   * Private helper method
   *
   * @param akahuAccount - Akahu API account response
   * @returns ExternalAccount
   */
  private mapAccount(akahuAccount: AkahuAccount): ExternalAccount {
    return {
      externalAccountId: akahuAccount._id,
      name: akahuAccount.name,
      type: akahuAccount.type,
      institution: akahuAccount.connection.name,
      accountNumber: akahuAccount.formatted_account,
      balance: akahuAccount.balance
        ? {
            current: akahuAccount.balance.current,
            available: akahuAccount.balance.available,
          }
        : undefined,
      status: akahuAccount.status,
      metadata: akahuAccount.meta,
    };
  }

  /**
   * Map Akahu transaction to ExternalTransaction
   * Private helper method
   *
   * @param akahuTransaction - Akahu API transaction response
   * @returns ExternalTransaction
   */
  private mapTransaction(akahuTransaction: AkahuTransaction): ExternalTransaction {
    return {
      externalTransactionId: akahuTransaction._id,
      date: new Date(akahuTransaction.date),
      amount: akahuTransaction.amount,
      description: akahuTransaction.description,
      merchant: akahuTransaction.merchant?.name,
      category: akahuTransaction.merchant?.category,
      type: akahuTransaction.type,
      balance: akahuTransaction.balance,
      rawData: akahuTransaction,
    };
  }
}
