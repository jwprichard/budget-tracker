import { Router } from 'express';
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  getAvailableBalance,
  getAccountTransactions,
} from '../controllers/account.controller';
import { validateBody, validateQuery } from '../middlewares/validation';
import { createAccountSchema, updateAccountSchema, accountQuerySchema } from '../schemas/account.schema';

const router = Router();

// GET /api/v1/accounts - Get all accounts
router.get('/', validateQuery(accountQuerySchema), getAllAccounts);

// POST /api/v1/accounts - Create account
router.post('/', validateBody(createAccountSchema), createAccount);

// GET /api/v1/accounts/:id - Get account by ID
router.get('/:id', getAccountById);

// PUT /api/v1/accounts/:id - Update account
router.put('/:id', validateBody(updateAccountSchema), updateAccount);

// DELETE /api/v1/accounts/:id - Delete account
router.delete('/:id', deleteAccount);

// GET /api/v1/accounts/:id/balance - Get account balance
router.get('/:id/balance', getAccountBalance);

// GET /api/v1/accounts/:id/available-balance - Get available balance from bank
router.get('/:id/available-balance', getAvailableBalance);

// GET /api/v1/accounts/:id/transactions - Get account transactions
router.get('/:id/transactions', getAccountTransactions);

export default router;
