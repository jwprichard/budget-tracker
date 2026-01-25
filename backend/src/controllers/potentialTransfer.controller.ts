/**
 * PotentialTransfer Controller
 * HTTP handlers for potential transfer detection and management
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PotentialTransferService } from '../services/potentialTransfer.service';

const prisma = new PrismaClient();
const potentialTransferService = new PotentialTransferService(prisma);

/**
 * Detect potential transfers from recent transactions
 * POST /api/v1/potential-transfers/detect
 */
export const detectTransfers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const daysBack = req.query['daysBack'] ? Number(req.query['daysBack']) : 30;

    const count = await potentialTransferService.detectPotentialTransfers(userId, daysBack);

    res.json({
      success: true,
      data: { detected: count },
      message: `Detected ${count} potential transfer${count !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending potential transfers for review
 * GET /api/v1/potential-transfers/pending
 */
export const getPendingTransfers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const transfers = await potentialTransferService.getPendingTransfers(userId);

    res.json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get count of pending potential transfers
 * GET /api/v1/potential-transfers/pending/count
 */
export const getPendingCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const count = await potentialTransferService.getPendingCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm a potential transfer - combine into single TRANSFER transaction
 * POST /api/v1/potential-transfers/:id/confirm
 */
export const confirmTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params['id'];

    if (!id) {
      res.status(400).json({ error: 'Missing transfer ID' });
      return;
    }

    const result = await potentialTransferService.confirmTransfer(id, userId);

    res.json({
      success: true,
      data: result,
      message: 'Transfer confirmed and transactions combined',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dismiss a potential transfer - keep as separate transactions
 * POST /api/v1/potential-transfers/:id/dismiss
 */
export const dismissTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = req.params['id'];

    if (!id) {
      res.status(400).json({ error: 'Missing transfer ID' });
      return;
    }

    await potentialTransferService.dismissTransfer(id, userId);

    res.json({
      success: true,
      message: 'Potential transfer dismissed',
    });
  } catch (error) {
    next(error);
  }
};
