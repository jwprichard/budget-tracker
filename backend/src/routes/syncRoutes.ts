import { Router } from 'express';
import {
  testConnection,
  setupConnection,
  linkAccount,
  unlinkAccount,
  triggerSync,
  getSyncStatus,
  getSyncHistory,
  getReviewTransactions,
  approveTransaction,
  rejectTransaction,
  linkTransaction,
  getConnections,
  getConnectedAccounts,
} from '../controllers/syncController';
import { validate } from '../middlewares/validate';
import {
  testConnectionSchema,
  setupConnectionSchema,
  linkAccountSchema,
  unlinkAccountSchema,
  triggerSyncSchema,
  getSyncStatusSchema,
  getSyncHistorySchema,
  getReviewTransactionsSchema,
  approveTransactionSchema,
  rejectTransactionSchema,
  linkTransactionSchema,
  getConnectedAccountsSchema,
} from '../validators/syncValidators';

const router = Router();

/**
 * Sync Routes
 *
 * Base path: /api/v1/sync
 *
 * All endpoints for bank synchronization:
 * - Connection management
 * - Account linking
 * - Sync triggering
 * - Status monitoring
 * - Transaction review
 */

// Connection management
router.get('/connections', getConnections);
router.post('/test', validate(testConnectionSchema), testConnection);
router.post('/setup', validate(setupConnectionSchema), setupConnection);
router.post('/link-account', validate(linkAccountSchema), linkAccount);
router.post('/unlink-account', validate(unlinkAccountSchema), unlinkAccount);
router.get('/accounts', validate(getConnectedAccountsSchema), getConnectedAccounts);

// Sync operations
router.post('/trigger', validate(triggerSyncSchema), triggerSync);
router.get('/status/:syncHistoryId', validate(getSyncStatusSchema), getSyncStatus);
router.get('/history', validate(getSyncHistorySchema), getSyncHistory);

// Transaction review
router.get('/review', validate(getReviewTransactionsSchema), getReviewTransactions);
router.post(
  '/review/:externalTransactionId/approve',
  validate(approveTransactionSchema),
  approveTransaction
);
router.post(
  '/review/:externalTransactionId/reject',
  validate(rejectTransactionSchema),
  rejectTransaction
);
router.post(
  '/review/:externalTransactionId/link',
  validate(linkTransactionSchema),
  linkTransaction
);

export default router;
