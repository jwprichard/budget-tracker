import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createRule,
  getRules,
  getRuleById,
  updateRule,
  deleteRule,
  bulkApplyRules,
} from '../controllers/rule.controller';

const router = Router();

// All rule routes require authentication
router.use(authenticate);

// Bulk apply rules to uncategorized transactions
router.post('/bulk-apply', bulkApplyRules);

// Create rule
router.post('/', createRule);

// Get all rules
router.get('/', getRules);

// Get rule by ID
router.get('/:id', getRuleById);

// Update rule
router.put('/:id', updateRule);

// Delete rule
router.delete('/:id', deleteRule);

export default router;
