import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionDto, CreateTransferDto, UpdateTransactionDto, TransactionQuery } from '../schemas/transaction.schema';

const prisma = new PrismaClient();
const transactionService = new TransactionService(prisma);

/**
 * Get all transactions with filtering and pagination
 * Query params: accountId, type, status, startDate, endDate, page, pageSize, sortBy, sortOrder
 */
export const getAllTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as TransactionQuery;
    const result = await transactionService.getAllTransactions(query);

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction by ID
 * Route params: id
 */
export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new transaction
 * Body: CreateTransactionDto
 */
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await transactionService.createTransaction(req.body as CreateTransactionDto);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a transfer between two accounts
 * Body: CreateTransferDto
 */
export const createTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await transactionService.createTransfer(req.body as CreateTransferDto);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Transfer created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a transaction
 * Route params: id
 * Body: UpdateTransactionDto
 */
export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body as UpdateTransactionDto);

    res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a transaction
 * If it's a transfer, deletes both linked transactions
 * Route params: id
 */
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await transactionService.deleteTransaction(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
