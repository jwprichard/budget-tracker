/**
 * PotentialTransfer Routes
 * API routes for potential transfer detection and management
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  detectTransfersSchema,
  potentialTransferIdSchema,
} from '../schemas/potentialTransfer.schema';
import {
  detectTransfers,
  getPendingTransfers,
  getPendingCount,
  confirmTransfer,
  dismissTransfer,
} from '../controllers/potentialTransfer.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/potential-transfers/detect - Detect potential transfers
router.post('/detect', validate(detectTransfersSchema), detectTransfers);

// GET /api/v1/potential-transfers/pending - Get pending transfers for review
router.get('/pending', getPendingTransfers);

// GET /api/v1/potential-transfers/pending/count - Get count of pending transfers
router.get('/pending/count', getPendingCount);

// POST /api/v1/potential-transfers/:id/confirm - Confirm a potential transfer
router.post('/:id/confirm', validate(potentialTransferIdSchema), confirmTransfer);

// POST /api/v1/potential-transfers/:id/dismiss - Dismiss a potential transfer
router.post('/:id/dismiss', validate(potentialTransferIdSchema), dismissTransfer);

export default router;
