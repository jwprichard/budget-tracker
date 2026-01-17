/**
 * Budget Routes
 * Defines API routes for budget management
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createBudget,
  getBudgets,
  getBudgetSummary,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from '../controllers/budget.controller';

const router = Router();

/**
 * All budget routes require authentication
 */
router.use(authenticate);

/**
 * Budget CRUD operations
 */
router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/summary', getBudgetSummary); // Must be before /:id to avoid conflict
router.get('/:id', getBudgetById);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
