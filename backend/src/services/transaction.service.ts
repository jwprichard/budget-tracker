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
   * @param query - Query parameters for filtering, sorting, and pagination
   */
  async getAllTransactions(query: TransactionQuery) {
    const { accountId, type, status, startDate, endDate, page, pageSize, sortBy, sortOrder } = query;

    const where: Prisma.TransactionWhereInput = {};

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
   * @throws AppError if transaction not found
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
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
   * @throws AppError if account not found or inactive
   */
  async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    // Verify account exists and is active
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
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
   * @throws AppError if accounts not found, inactive, or same account
   */
  async createTransfer(data: CreateTransferDto): Promise<{ fromTransaction: Transaction; toTransaction: Transaction }> {
    // Verify both accounts exist and are active
    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      this.prisma.account.findUnique({ where: { id: data.toAccountId } }),
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
   * @throws AppError if transaction not found, is a transfer, or account invalid
   */
  async updateTransaction(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);

    // Prevent direct updates to transfer transactions
    if (transaction.transferToAccountId) {
      throw new AppError('Cannot update transfer transactions directly. Delete and recreate instead.', 400);
    }

    // If changing account, verify new account exists and is active
    if (data.accountId && data.accountId !== transaction.accountId) {
      const account = await this.prisma.account.findUnique({
        where: { id: data.accountId },
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
   * @throws AppError if transaction not found
   */
  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.getTransactionById(id);

    // If it's a transfer, delete both transactions
    if (transaction.transferToAccountId) {
      // Find the linked transaction
      const linkedTransaction = await this.prisma.transaction.findFirst({
        where: {
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
      await this.prisma.$transaction([
        this.prisma.transaction.delete({ where: { id: transaction.id } }),
        linkedTransaction
          ? this.prisma.transaction.delete({ where: { id: linkedTransaction.id } })
          : Promise.resolve(),
      ]);
    } else {
      // Regular transaction - just delete
      await this.prisma.transaction.delete({ where: { id } });
    }
  }
}
