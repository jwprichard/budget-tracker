import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../services/analytics.service';
import {
  DailyBalancesQuery,
  CategoryTotalsQuery,
  SpendingTrendsQuery,
  IncomeVsExpenseQuery,
} from '../schemas/analytics.schema';

const prisma = new PrismaClient();
const analyticsService = new AnalyticsService(prisma);

/**
 * GET /api/v1/analytics/daily-balances
 * Calculate daily balances for accounts over a date range
 */
export const getDailyBalances = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as DailyBalancesQuery;

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const accountIds = query.accountIds;

    const result = await analyticsService.getDailyBalances(
      userId,
      startDate,
      endDate,
      accountIds
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/analytics/category-totals
 * Aggregate spending/income by category for a date range
 */
export const getCategoryTotals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as CategoryTotalsQuery;

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const accountIds = query.accountIds;
    const type = query.type;
    const includeSubcategories = query.includeSubcategories;

    const result = await analyticsService.getCategoryTotals(
      userId,
      startDate,
      endDate,
      type,
      accountIds,
      includeSubcategories
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/analytics/spending-trends
 * Get time-series data for spending/income trends
 */
export const getSpendingTrends = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as SpendingTrendsQuery;

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const accountIds = query.accountIds;
    const categoryIds = query.categoryIds;
    const groupBy = query.groupBy;

    const result = await analyticsService.getSpendingTrends(
      userId,
      startDate,
      endDate,
      groupBy,
      accountIds,
      categoryIds
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/analytics/income-vs-expense
 * Compare income and expenses over time periods
 */
export const getIncomeVsExpense = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as IncomeVsExpenseQuery;

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const accountIds = query.accountIds;
    const categoryIds = query.categoryIds;
    const groupBy = query.groupBy;

    const result = await analyticsService.getSpendingTrends(
      userId,
      startDate,
      endDate,
      groupBy,
      accountIds,
      categoryIds
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
