import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AccountService } from '../services/account.service';
import { CreateAccountDto, UpdateAccountDto } from '../schemas/account.schema';

const prisma = new PrismaClient();
const accountService = new AccountService(prisma);

/**
 * Get all accounts
 * Query params: includeInactive (boolean)
 */
export const getAllAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const includeInactive = req.query['includeInactive'] === 'true';
    const accounts = await accountService.getAllAccounts(userId, includeInactive);

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account by ID
 * Route params: id
 */
export const getAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await accountService.getAccountById(req.params['id'] ?? '', userId);

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new account
 * Body: CreateAccountDto
 */
export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await accountService.createAccount(req.body as CreateAccountDto, userId);

    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an account
 * Route params: id
 * Body: UpdateAccountDto
 */
export const updateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await accountService.updateAccount(req.params['id'] ?? '', req.body as UpdateAccountDto, userId);

    res.status(200).json({
      success: true,
      data: account,
      message: 'Account updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an account
 * Soft deletes if has transactions, hard deletes if empty
 * Route params: id
 */
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const account = await accountService.deleteAccount(req.params['id'] ?? '', userId);

    res.status(200).json({
      success: true,
      data: account,
      message: account.isActive === false ? 'Account deactivated' : 'Account deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get account balance
 * Calculates current balance from transactions
 * Route params: id
 */
export const getAccountBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const balance = await accountService.getAccountBalance(req.params['id'] ?? '', userId);

    res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available balance for linked account
 * Fetches real-time balance from Akahu API
 * Route params: id (account ID)
 */
export const getAvailableBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const balance = await accountService.getAvailableBalance(req.params['id'] ?? '', userId);

    res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transactions for an account (paginated)
 * Route params: id
 * Query params: page, pageSize
 */
export const getAccountTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query['page'] as string) || 1;
    const pageSize = parseInt(req.query['pageSize'] as string) || 50;

    const result = await accountService.getAccountTransactions(req.params['id'] ?? '', userId, page, pageSize);

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};
