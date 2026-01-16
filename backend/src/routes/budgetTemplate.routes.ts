/**
 * Budget Template Routes
 * Defines API routes for budget template management
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplateBudgets,
  generateBudgets,
  updateBudgetInstance,
} from '../controllers/budgetTemplate.controller';

const router = Router();

/**
 * All budget template routes require authentication
 */
router.use(authenticate);

/**
 * Budget template CRUD operations
 */
router.post('/', createTemplate);
router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

/**
 * Template-specific operations
 */
router.get('/:id/budgets', getTemplateBudgets); // Get all budgets for a template
router.post('/:id/generate', generateBudgets); // Generate additional budget instances

/**
 * Budget instance operations with scope
 */
router.put('/budgets/:budgetId', updateBudgetInstance); // Update with scope

export default router;
