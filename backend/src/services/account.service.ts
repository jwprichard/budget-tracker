import { PrismaClient, Account } from '@prisma/client';
import { CreateAccountDto, UpdateAccountDto } from '../schemas/account.schema';
import { AppError } from '../middlewares/errorHandler';

export class AccountService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all accounts
   * @param includeInactive - Whether to include inactive accounts (default: false)
   */
  async getAllAccounts(includeInactive: boolean = false): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get account by ID
   * @param id - Account UUID
   * @throws AppError if account not found
   */
  async getAccountById(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    return account;
  }

  /**
   * Create a new account
   * @param data - Account creation data
   */
  async createAccount(data: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
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
   * @throws AppError if account not found
   */
  async updateAccount(id: string, data: UpdateAccountDto): Promise<Account> {
    // Verify account exists
    await this.getAccountById(id);

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
   * @throws AppError if account not found
   */
  async deleteAccount(id: string): Promise<Account> {
    // Verify account exists
    await this.getAccountById(id);

    // Check if account has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { accountId: id },
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
   * @throws AppError if account not found
   */
  async getAccountBalance(
    id: string
  ): Promise<{ accountId: string; currentBalance: number; transactionCount: number }> {
    const account = await this.getAccountById(id);

    const aggregation = await this.prisma.transaction.aggregate({
      where: { accountId: id },
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
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 50)
   * @throws AppError if account not found
   */
  async getAccountTransactions(id: string, page: number = 1, pageSize: number = 50) {
    // Verify account exists
    await this.getAccountById(id);

    const skip = (page - 1) * pageSize;

    const [transactions, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { accountId: id },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.transaction.count({
        where: { accountId: id },
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
}
