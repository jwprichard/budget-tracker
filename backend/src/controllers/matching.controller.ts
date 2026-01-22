/**
 * Matching Controller
 * HTTP handlers for transaction matching operations
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, MatchMethod } from '@prisma/client';
import { MatchingService } from '../services/matching.service';
import {
  GetPendingMatchesQuery,
  GetMatchHistoryQuery,
  ConfirmMatchBody,
  DismissMatchBody,
  ManualMatchBody,
  BatchAutoMatchBody,
  AutoMatchBody,
  MatchIdParam,
} from '../schemas/matching.schema';

const prisma = new PrismaClient();
const matchingService = new MatchingService(prisma);

/**
 * Get pending match suggestions for review
 * GET /api/v1/matching/pending
 */
export const getPendingMatches = async (
  req: Request<unknown, unknown, unknown, GetPendingMatchesQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { limit } = req.query;
    const pendingMatches = await matchingService.getPendingMatches(userId, limit);

    res.json({
      success: true,
      data: pendingMatches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm a suggested match
 * POST /api/v1/matching/confirm
 */
export const confirmMatch = async (
  req: Request<unknown, unknown, ConfirmMatchBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { transactionId, plannedTransactionId } = req.body;

    const result = await matchingService.confirmMatch(
      transactionId,
      plannedTransactionId,
      85, // Default confidence for confirmed matches from review
      MatchMethod.AUTO_REVIEWED,
      userId
    );

    res.json({
      success: true,
      data: result,
      message: 'Match confirmed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dismiss a suggested match
 * POST /api/v1/matching/dismiss
 */
export const dismissMatch = async (
  req: Request<unknown, unknown, DismissMatchBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { transactionId, plannedTransactionId } = req.body;

    await matchingService.dismissMatch(transactionId, plannedTransactionId, userId);

    res.json({
      success: true,
      message: 'Match suggestion dismissed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually link a transaction to a planned transaction
 * POST /api/v1/matching/manual
 */
export const manualMatch = async (
  req: Request<unknown, unknown, ManualMatchBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { transactionId, plannedTransactionId } = req.body;

    const result = await matchingService.manualMatch(
      transactionId,
      plannedTransactionId,
      userId
    );

    res.json({
      success: true,
      data: result,
      message: 'Transaction manually matched',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get match history
 * GET /api/v1/matching/history
 */
export const getMatchHistory = async (
  req: Request<unknown, unknown, unknown, GetMatchHistoryQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, limit, offset } = req.query;

    const result = await matchingService.getMatchHistory(
      userId,
      startDate,
      endDate,
      limit,
      offset
    );

    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-match a single transaction
 * POST /api/v1/matching/auto
 */
export const autoMatch = async (
  req: Request<unknown, unknown, AutoMatchBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { transactionId } = req.body;

    const result = await matchingService.autoMatch(transactionId, userId);

    res.json({
      success: true,
      data: result,
      message: result?.matched ? 'Transaction auto-matched' : 'No match found',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch auto-match multiple transactions
 * POST /api/v1/matching/auto/batch
 */
export const batchAutoMatch = async (
  req: Request<unknown, unknown, BatchAutoMatchBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { transactionIds } = req.body;

    const result = await matchingService.batchAutoMatch(transactionIds, userId);

    res.json({
      success: true,
      data: result,
      message: `Matched ${result.matched} of ${transactionIds.length} transactions`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Undo a match (unmatch)
 * DELETE /api/v1/matching/:matchId
 */
export const unmatch = async (
  req: Request<MatchIdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const { matchId } = req.params;

    await matchingService.unmatch(matchId, userId);

    res.json({
      success: true,
      message: 'Match removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
