import { Router } from 'express';
import {
  resetTransactions,
  resetAccounts,
  resetBankConnections,
  resetEverything,
  getDatabaseStats,
} from '../controllers/dev.controller';

const router = Router();

// GET /api/v1/dev/stats - Get database statistics
router.get('/stats', getDatabaseStats);

// POST /api/v1/dev/reset/transactions - Reset all transactions
router.post('/reset/transactions', resetTransactions);

// POST /api/v1/dev/reset/accounts - Reset all accounts
router.post('/reset/accounts', resetAccounts);

// POST /api/v1/dev/reset/bank-connections - Reset bank connections
router.post('/reset/bank-connections', resetBankConnections);

// POST /api/v1/dev/reset/everything - Reset everything (nuclear)
router.post('/reset/everything', resetEverything);

export default router;
