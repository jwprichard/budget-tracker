/**
 * Budget Controller
 * Handles HTTP requests for budget management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetService } from '../services/budget.service';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
} from '../schemas/budget.schema';

const prisma = new PrismaClient();
const budgetService = new BudgetService(prisma);

/**
 * Create a new budget
 * POST /api/v1/budgets
 */
export const createBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const validatedData = createBudgetSchema.parse(req.body);

    const budget = await budgetService.createBudget(validatedData, userId);

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all budgets for the authenticated user
 * GET /api/v1/budgets
 */
export const getBudgets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = budgetQuerySchema.parse(req.query);

    // If includeStatus is true (default), return budgets with status
    const budgets = query.includeStatus
      ? await budgetService.getBudgetsWithStatus(userId, query)
      : await budgetService.getBudgets(userId, query);

    res.status(200).json({
      success: true,
      data: budgets,
      message: 'Budgets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get budget summary for current period
 * GET /api/v1/budgets/summary
 */
export const getBudgetSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const summary = await budgetService.getBudgetSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Budget summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical comparison data for budgets
 * GET /api/v1/budgets/historical?type=previous|trend|yoy&periodType=WEEKLY|MONTHLY
 */
export const getBudgetHistorical = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const type = (req.query['type'] as string) || 'previous';
    const periodType = (req.query['periodType'] as 'WEEKLY' | 'MONTHLY') || 'MONTHLY';

    // Validate type
    if (!['previous', 'trend', 'yoy'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid comparison type. Must be "previous", "trend", or "yoy"',
      });
      return;
    }

    // Validate periodType
    if (!['WEEKLY', 'MONTHLY'].includes(periodType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid period type. Must be "WEEKLY" or "MONTHLY"',
      });
      return;
    }

    const historical = await budgetService.getBudgetHistoricalComparison(
      userId,
      type as 'previous' | 'trend' | 'yoy',
      periodType
    );

    res.status(200).json({
      success: true,
      data: historical,
      message: 'Historical comparison data retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single budget by ID
 * GET /api/v1/budgets/:id
 */
export const getBudgetById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const budget = await budgetService.getBudgetWithStatus(id!, userId);

    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a budget
 * PUT /api/v1/budgets/:id
 */
export const updateBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const validatedData = updateBudgetSchema.parse(req.body);

    const budget = await budgetService.updateBudget(id!, validatedData, userId);

    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a budget
 * DELETE /api/v1/budgets/:id
 */
export const deleteBudget = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await budgetService.deleteBudget(id!, userId);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
