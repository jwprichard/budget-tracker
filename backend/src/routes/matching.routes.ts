/**
 * Matching Routes
 * API routes for transaction matching operations
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validation';
import {
  getPendingMatchesQuerySchema,
  getMatchHistoryQuerySchema,
  confirmMatchBodySchema,
  dismissMatchBodySchema,
  manualMatchBodySchema,
  batchAutoMatchBodySchema,
  autoMatchBodySchema,
  matchIdParamSchema,
} from '../schemas/matching.schema';
import {
  getPendingMatches,
  confirmMatch,
  dismissMatch,
  manualMatch,
  getMatchHistory,
  autoMatch,
  batchAutoMatch,
  unmatch,
} from '../controllers/matching.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/matching/pending
 * @desc Get pending match suggestions for review
 * @access Private
 */
router.get(
  '/pending',
  validateQuery(getPendingMatchesQuerySchema),
  getPendingMatches as any
);

/**
 * @route GET /api/v1/matching/history
 * @desc Get match history
 * @access Private
 */
router.get(
  '/history',
  validateQuery(getMatchHistoryQuerySchema),
  getMatchHistory as any
);

/**
 * @route POST /api/v1/matching/confirm
 * @desc Confirm a suggested match
 * @access Private
 */
router.post(
  '/confirm',
  validateBody(confirmMatchBodySchema),
  confirmMatch
);

/**
 * @route POST /api/v1/matching/dismiss
 * @desc Dismiss a suggested match
 * @access Private
 */
router.post(
  '/dismiss',
  validateBody(dismissMatchBodySchema),
  dismissMatch
);

/**
 * @route POST /api/v1/matching/manual
 * @desc Manually link a transaction to a planned transaction
 * @access Private
 */
router.post(
  '/manual',
  validateBody(manualMatchBodySchema),
  manualMatch
);

/**
 * @route POST /api/v1/matching/auto
 * @desc Auto-match a single transaction
 * @access Private
 */
router.post(
  '/auto',
  validateBody(autoMatchBodySchema),
  autoMatch
);

/**
 * @route POST /api/v1/matching/auto/batch
 * @desc Batch auto-match multiple transactions
 * @access Private
 */
router.post(
  '/auto/batch',
  validateBody(batchAutoMatchBodySchema),
  batchAutoMatch
);

/**
 * @route DELETE /api/v1/matching/:matchId
 * @desc Undo a match (unmatch)
 * @access Private
 */
router.delete(
  '/:matchId',
  validateParams(matchIdParamSchema),
  unmatch
);

export default router;
