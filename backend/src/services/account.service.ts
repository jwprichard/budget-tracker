import { PrismaClient, Account } from '@prisma/client';
import { CreateAccountDto, UpdateAccountDto } from '../schemas/account.schema';
import { AppError } from '../middlewares/errorHandler';
import { AkahuApiClient } from './akahu/AkahuApiClient';
import { decrypt } from '../utils/encryption';

export class AccountService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all accounts for a user
   * @param userId - User UUID
   * @param includeInactive - Whether to include inactive accounts (default: false)
   */
  async getAllAccounts(userId: string, includeInactive: boolean = false): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get account by ID for a specific user
   * @param id - Account UUID
   * @param userId - User UUID
   * @throws AppError if account not found or doesn't belong to user
   */
  async getAccountById(id: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    return account;
  }

  /**
   * Create a new account for a user
   * @param data - Account creation data
   * @param userId - User UUID
   */
  async createAccount(data: CreateAccountDto, userId: string): Promise<Account> {
    return this.prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        category: data.category,
        currency: data.currency || 'USD',
        initialBalance: data.initialBalance,
      },
    });
  }

  /**
   * Update an existing account
   * @param id - Account UUID
   * @param data - Account update data
   * @param userId - User UUID
   * @throws AppError if account not found or doesn't belong to user
   */
  async updateAccount(id: string, data: UpdateAccountDto, userId: string): Promise<Account> {
    // Verify account exists and belongs to user
    await this.getAccountById(id, userId);

    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an account
   * Soft delete (set isActive=false) if account has transactions
   * Hard delete if account has no transactions
   * @param id - Account UUID
   * @param userId - User UUID
   * @throws AppError if account not found or doesn't belong to user
   */
  async deleteAccount(id: string, userId: string): Promise<Account> {
    // Verify account exists and belongs to user
    await this.getAccountById(id, userId);

    // Check if account has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { accountId: id, userId },
    });

    if (transactionCount > 0) {
      // Soft delete - set inactive
      return this.prisma.account.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no transactions
      return this.prisma.account.delete({
        where: { id },
      });
    }
  }

  /**
   * Get account balance
   * Calculates current balance by summing all transactions
   * Formula: currentBalance = initialBalance + sum(transactions.amount)
   * @param id - Account UUID
   * @param userId - User UUID
   * @throws AppError if account not found or doesn't belong to user
   */
  async getAccountBalance(
    id: string,
    userId: string
  ): Promise<{ accountId: string; currentBalance: number; transactionCount: number }> {
    const account = await this.getAccountById(id, userId);

    const aggregation = await this.prisma.transaction.aggregate({
      where: { accountId: id, userId },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const transactionTotal = aggregation._sum.amount?.toNumber() || 0;
    const currentBalance = account.initialBalance.toNumber() + transactionTotal;

    return {
      accountId: id,
      currentBalance,
      transactionCount: aggregation._count,
    };
  }

  /**
   * Get transactions for a specific account (paginated)
   * @param id - Account UUID
   * @param userId - User UUID
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 50)
   * @throws AppError if account not found or doesn't belong to user
   */
  async getAccountTransactions(id: string, userId: string, page: number = 1, pageSize: number = 50) {
    // Verify account exists and belongs to user
    await this.getAccountById(id, userId);

    const skip = (page - 1) * pageSize;

    const [transactions, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { accountId: id, userId },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.transaction.count({
        where: { accountId: id, userId },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalItems: totalCount,
      },
    };
  }

  /**
   * Get available balance from bank for linked account
   * Fetches real-time balance data from Akahu API
   * @param id - Account UUID
   * @param userId - User UUID
   * @returns Balance data or null if not linked
   * @throws AppError if account not found or doesn't belong to user
   */
  async getAvailableBalance(
    id: string,
    userId: string
  ): Promise<{ current: number; available: number | null } | null> {
    // Check if account exists, belongs to user, and is linked to bank
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
      include: {
        linkedAccount: {
          include: {
            connection: true,
          },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Return null if not linked to bank
    if (!account.isLinkedToBank || !account.linkedAccount) {
      return null;
    }

    // Get connection and decrypt tokens
    const connection = account.linkedAccount.connection;
    const appToken = decrypt(connection.appToken ?? '');
    const userToken = decrypt(connection.userToken ?? '');

    // Use AkahuApiClient to fetch account details
    const apiClient = new AkahuApiClient();
    const accounts = await apiClient.getAccounts(appToken, userToken);

    // Find matching account
    const akahuAccount = accounts.find(
      (acc) => acc._id === account.linkedAccount!.externalAccountId
    );

    if (!akahuAccount || !akahuAccount.balance) {
      return null;
    }

    // Return balance data
    return {
      current: akahuAccount.balance.current,
      available: akahuAccount.balance.available || null,
    };
  }
}
