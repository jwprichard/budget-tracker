/**
 * Planned Transaction Routes
 * Defines API routes for planned transaction management
 *
 * Supports:
 * - Planned transaction templates (recurring patterns)
 * - One-time planned transactions
 * - Virtual occurrences (generated on-the-fly from templates)
 * - Override instances (customized occurrences)
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  // Template endpoints
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplateOccurrences,
  // Planned transaction endpoints
  createPlannedTransaction,
  getPlannedTransactions,
  getPlannedTransactionById,
  updatePlannedTransaction,
  deletePlannedTransaction,
} from '../controllers/plannedTransaction.controller';

const router = Router();

/**
 * All planned transaction routes require authentication
 */
router.use(authenticate);

// ============================================================================
// Planned Transaction Template Routes
// ============================================================================

/**
 * Template CRUD operations
 * Base path: /api/v1/planned-transactions/templates
 */
router.post('/templates', createTemplate);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

/**
 * Template occurrence operations
 */
router.get('/templates/:id/occurrences', getTemplateOccurrences);

// ============================================================================
// Planned Transaction Routes (One-time & Overrides)
// ============================================================================

/**
 * Planned transaction CRUD operations
 * Base path: /api/v1/planned-transactions
 *
 * Note: The :id parameter can be either:
 * - A real UUID for one-time transactions or overrides
 * - A virtual ID (virtual_{templateId}_{date}) for template occurrences
 */
router.post('/', createPlannedTransaction);
router.get('/', getPlannedTransactions);
router.get('/:id', getPlannedTransactionById);
router.put('/:id', updatePlannedTransaction);
router.delete('/:id', deletePlannedTransaction);

export default router;
