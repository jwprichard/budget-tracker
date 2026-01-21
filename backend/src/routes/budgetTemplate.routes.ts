/**
 * Budget Template Routes
 * Defines API routes for budget template management
 *
 * With virtual periods architecture:
 * - Templates define patterns (no pre-generated instances)
 * - Overrides are created when user customizes a virtual period
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplateOverrides,
  createPeriodOverride,
  updateOverride,
  deleteOverride,
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
 * Template override operations
 */
router.get('/:id/overrides', getTemplateOverrides); // Get all overrides for a template
router.post('/:id/overrides', createPeriodOverride); // Create override for a virtual period

/**
 * Override CRUD operations
 */
router.put('/overrides/:budgetId', updateOverride); // Update an existing override
router.delete('/overrides/:budgetId', deleteOverride); // Delete an override

export default router;
