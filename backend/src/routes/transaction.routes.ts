import { Router } from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  parseCSV,
} from '../controllers/transaction.controller';
import { validateBody, validateQuery } from '../middlewares/validation';
import {
  createTransactionSchema,
  createTransferSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '../schemas/transaction.schema';
import { uploadCSV } from '../middlewares/upload';

const router = Router();

// GET /api/v1/transactions - Get all transactions (filterable, paginated)
router.get('/', validateQuery(transactionQuerySchema), getAllTransactions);

// POST /api/v1/transactions - Create transaction
router.post('/', validateBody(createTransactionSchema), createTransaction);

// POST /api/v1/transactions/transfer - Create transfer
router.post('/transfer', validateBody(createTransferSchema), createTransfer);

// POST /api/v1/transactions/parse-csv - Parse CSV file
router.post('/parse-csv', uploadCSV.single('file'), parseCSV);

// GET /api/v1/transactions/:id - Get transaction by ID
router.get('/:id', getTransactionById);

// PUT /api/v1/transactions/:id - Update transaction
router.put('/:id', validateBody(updateTransactionSchema), updateTransaction);

// DELETE /api/v1/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

export default router;
