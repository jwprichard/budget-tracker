import { PrismaClient, Transaction, Prisma } from '@prisma/client';
import {
  CreateTransactionDto,
  CreateTransferDto,
  UpdateTransactionDto,
  TransactionQuery,
} from '../schemas/transaction.schema';
import { AppError } from '../middlewares/errorHandler';

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all transactions with filtering and pagination
   * @param userId - User UUID
   * @param query - Query parameters for filtering, sorting, and pagination
   */
  async getAllTransactions(userId: string, query: TransactionQuery) {
    const { accountId, type, status, startDate, endDate, page, pageSize, sortBy, sortOrder } = query;

    const where: Prisma.TransactionWhereInput = {
      userId, // Filter by user
    };

    if (accountId) where.accountId = accountId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const skip = (page - 1) * pageSize;

    const [transactions, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: { id: true, name: true, type: true },
          },
          transferAccount: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
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
   * Get transaction by ID with related account info
   * @param id - Transaction UUID
   * @param userId - User UUID
   * @throws AppError if transaction not found or doesn't belong to user
   */
  async getTransactionById(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
        transferAccount: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction as Transaction;
  }

  /**
   * Create a new transaction
   * Automatically converts amount to negative for expenses
   * @param data - Transaction creation data
   * @param userId - User UUID
   * @throws AppError if account not found, doesn't belong to user, or inactive
   */
  async createTransaction(data: CreateTransactionDto, userId: string): Promise<Transaction> {
    // Verify account exists, belongs to user, and is active
    const account = await this.prisma.account.findFirst({
      where: { id: data.accountId, userId },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    if (!account.isActive) {
      throw new AppError('Cannot add transaction to inactive account', 400);
    }

    // Convert amount based on transaction type
    let amount = data.amount;
    if (data.type === 'EXPENSE') {
      amount = -Math.abs(amount); // Expenses are negative
    } else if (data.type === 'INCOME') {
      amount = Math.abs(amount); // Income is positive
    }

    return this.prisma.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        type: data.type,
        amount,
        date: new Date(data.date),
        description: data.description,
        notes: data.notes,
        status: data.status || 'CLEARED',
      },
    });
  }

  /**
   * Create a transfer between two accounts
   * Creates two transactions: expense from source, income to destination
   * Both transactions are linked via transferToAccountId
   * Uses database transaction to ensure atomicity
   * @param data - Transfer creation data
   * @param userId - User UUID
   * @throws AppError if accounts not found, don't belong to user, inactive, or same account
   */
  async createTransfer(data: CreateTransferDto, userId: string): Promise<{ fromTransaction: Transaction; toTransaction: Transaction }> {
    // Verify both accounts exist, belong to user, and are active
    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.account.findFirst({ where: { id: data.fromAccountId, userId } }),
      this.prisma.account.findFirst({ where: { id: data.toAccountId, userId } }),
    ]);

    if (!fromAccount) {
      throw new AppError('Source account not found', 404);
    }
    if (!toAccount) {
      throw new AppError('Destination account not found', 404);
    }
    if (!fromAccount.isActive || !toAccount.isActive) {
      throw new AppError('Cannot transfer to/from inactive account', 400);
    }

    // Create two transactions in a database transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Transaction 1: Expense from source account
      const fromTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.fromAccountId,
          type: 'EXPENSE',
          amount: -Math.abs(data.amount), // Negative for expense
          date: new Date(data.date),
          description: data.description,
          notes: data.notes,
          status: 'CLEARED',
          transferToAccountId: data.toAccountId,
        },
      });

      // Transaction 2: Income to destination account
      const toTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.toAccountId,
          type: 'INCOME',
          amount: Math.abs(data.amount), // Positive for income
          date: new Date(data.date),
          description: data.description,
          notes: data.notes,
          status: 'CLEARED',
          transferToAccountId: data.fromAccountId,
        },
      });

      return { fromTransaction, toTransaction };
    });

    return result;
  }

  /**
   * Update an existing transaction
   * Prevents updates to transfer transactions (must delete and recreate)
   * Adjusts amount based on type if both are provided
   * @param id - Transaction UUID
   * @param data - Transaction update data
   * @param userId - User UUID
   * @throws AppError if transaction not found, doesn't belong to user, is a transfer, or account invalid
   */
  async updateTransaction(id: string, data: UpdateTransactionDto, userId: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(id, userId);

    // Prevent direct updates to transfer transactions
    if (transaction.transferToAccountId) {
      throw new AppError('Cannot update transfer transactions directly. Delete and recreate instead.', 400);
    }

    // If changing account, verify new account exists, belongs to user, and is active
    if (data.accountId && data.accountId !== transaction.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: data.accountId, userId },
      });
      if (!account || !account.isActive) {
        throw new AppError('Invalid account', 400);
      }
    }

    // Adjust amount based on type
    let amount = data.amount;
    if (amount !== undefined) {
      // Use provided type or fall back to existing transaction type
      const transactionType = data.type || transaction.type;
      if (transactionType === 'EXPENSE') {
        amount = -Math.abs(amount);
      } else if (transactionType === 'INCOME') {
        amount = Math.abs(amount);
      }
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        amount,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  /**
   * Delete a transaction
   * If it's a transfer, deletes both linked transactions
   * Uses database transaction to ensure atomicity
   * @param id - Transaction UUID
   * @param userId - User UUID
   * @throws AppError if transaction not found or doesn't belong to user
   */
  async deleteTransaction(id: string, userId: string): Promise<void> {
    const transaction = await this.getTransactionById(id, userId);

    // If it's a transfer, delete both transactions
    if (transaction.transferToAccountId) {
      // Find the linked transaction (must also belong to same user)
      const linkedTransaction = await this.prisma.transaction.findFirst({
        where: {
          userId,
          accountId: transaction.transferToAccountId,
          transferToAccountId: transaction.accountId,
          date: transaction.date,
          // Amount is opposite (source negative, destination positive)
          amount: {
            equals: transaction.amount.mul(-1),
          },
        },
      });

      // Delete both transactions in a database transaction
      const deleteOperations = [
        this.prisma.transaction.delete({ where: { id: transaction.id } }),
      ];

      if (linkedTransaction) {
        deleteOperations.push(
          this.prisma.transaction.delete({ where: { id: linkedTransaction.id } })
        );
      }

      await this.prisma.$transaction(deleteOperations);
    } else {
      // Regular transaction - just delete
      await this.prisma.transaction.delete({ where: { id } });
    }
  }

  /**
   * Find duplicate transactions
   * Checks for transactions with same date, amount, and description
   * @param accountId - Account ID to search within
   * @param userId - User UUID
   * @param transactions - Array of transactions to check
   * @returns Array of indices that are duplicates
   */
  async findDuplicates(
    accountId: string,
    userId: string,
    transactions: Array<{ date: Date; amount: number; description: string }>
  ): Promise<number[]> {
    const duplicateIndices: number[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      if (!transaction) continue;

      const { date, amount, description } = transaction;

      // Normalize date to start of day for comparison
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      // Check if transaction with same date, amount, and description already exists
      const existing = await this.prisma.transaction.findFirst({
        where: {
          accountId,
          userId,
          date: {
            gte: dateStart,
            lte: dateEnd,
          },
          amount,
          description: {
            equals: description.trim(),
            mode: 'insensitive', // Case-insensitive comparison
          },
        },
      });

      if (existing) {
        duplicateIndices.push(i);
      }
    }

    return duplicateIndices;
  }

  /**
   * Bulk import transactions
   * @param accountId - Account ID to import into
   * @param transactions - Array of transactions to import
   * @param skipDuplicates - Whether to skip duplicate transactions
   * @param userId - User UUID
   * @returns Import summary with counts and errors
   */
  async bulkImport(
    accountId: string,
    transactions: Array<{
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      amount: number;
      date: string | Date;
      description: string;
      notes?: string;
      status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
    }>,
    skipDuplicates = true,
    userId: string
  ): Promise<{
    imported: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    // Verify account exists and belongs to user
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; message: string }>,
    };

    // Detect duplicates if skipDuplicates is enabled
    let duplicateIndices: number[] = [];
    if (skipDuplicates) {
      const transactionsForDuplicateCheck = transactions.map((t) => ({
        date: new Date(t.date),
        amount: t.type === 'EXPENSE' ? -Math.abs(t.amount) : Math.abs(t.amount),
        description: t.description,
      }));
      duplicateIndices = await this.findDuplicates(accountId, userId, transactionsForDuplicateCheck);
    }

    // Process each transaction
    for (let i = 0; i < transactions.length; i++) {
      // Skip duplicates
      if (duplicateIndices.includes(i)) {
        result.skipped++;
        continue;
      }

      try {
        const transaction = transactions[i];
        if (!transaction) continue;

        // Convert amount based on type
        let amount = transaction.amount;
        if (transaction.type === 'EXPENSE') {
          amount = -Math.abs(amount);
        } else if (transaction.type === 'INCOME') {
          amount = Math.abs(amount);
        }

        // Create transaction
        await this.prisma.transaction.create({
          data: {
            userId,
            accountId,
            type: transaction.type,
            amount,
            date: new Date(transaction.date),
            description: transaction.description,
            notes: transaction.notes || null,
            status: transaction.status || 'CLEARED',
          },
        });

        result.imported++;
      } catch (error) {
        result.errors.push({
          row: i + 1, // 1-indexed for user display
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }
}
