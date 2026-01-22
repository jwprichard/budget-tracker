/**
 * Forecast Controller
 * Handles HTTP requests for cash flow forecasting endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ForecastService } from '../services/forecast.service';
import {
  forecastQuerySchema,
  lowBalanceWarningQuerySchema,
} from '../schemas/plannedTransaction.schema';

const prisma = new PrismaClient();
const forecastService = new ForecastService(prisma);

/**
 * Get forecast for a date range
 * GET /api/v1/forecast
 * Query params: startDate, endDate, days (default 90), accountIds (comma-separated)
 */
export const getForecast = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = forecastQuerySchema.parse(req.query);

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      // Default to 'days' from now
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + (query.days || 90));
    }

    // Parse account IDs
    let accountIds: string[] | undefined;
    if (query.accountIds) {
      accountIds = query.accountIds.split(',').filter((id) => id.trim());
    }

    const forecast = await forecastService.calculateForecast(
      userId,
      startDate,
      endDate,
      accountIds
    );

    res.status(200).json({
      success: true,
      data: forecast,
      message: 'Forecast calculated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get forecast summary
 * GET /api/v1/forecast/summary
 * Query params: days (default 90)
 */
export const getForecastSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = forecastQuerySchema.parse(req.query);

    const summary = await forecastService.getForecastSummary(userId, query.days || 90);

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Forecast summary retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low balance warnings
 * GET /api/v1/forecast/low-balance-warnings
 * Query params: threshold (default 0), days (default 90)
 */
export const getLowBalanceWarnings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const query = lowBalanceWarningQuerySchema.parse(req.query);

    const warnings = await forecastService.getLowBalanceWarnings(
      userId,
      query.days || 90,
      query.threshold || 0
    );

    res.status(200).json({
      success: true,
      data: warnings,
      message: 'Low balance warnings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
