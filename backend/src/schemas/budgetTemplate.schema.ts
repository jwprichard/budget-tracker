/**
 * Zod validation schemas for budget template API endpoints
 */

import { z } from 'zod';
import { budgetPeriodSchema, budgetTypeSchema } from './budget.schema';

/**
 * Create budget template request schema with validation
 */
export const createBudgetTemplateSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  accountId: z.string().uuid('Invalid account ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large'),
  type: budgetTypeSchema.default('EXPENSE'),
  periodType: budgetPeriodSchema,
  interval: z.number().int().min(1).max(365).default(1),
  firstStartDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime().optional(),
  includeSubcategories: z.boolean().default(false),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  notes: z.string().max(500).optional(),
});

/**
 * Update budget template request schema
 */
export const updateBudgetTemplateSchema = z.object({
  accountId: z.string().uuid('Invalid account ID').optional(),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large')
    .optional(),
  type: budgetTypeSchema.optional(),
  interval: z.number().int().min(1).max(365).optional(),
  includeSubcategories: z.boolean().optional(),
  firstStartDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).nullable().optional(),
});

/**
 * Create period override schema
 * Used when customizing a specific virtual period
 */
export const createOverrideSchema = z.object({
  periodStartDate: z.string().datetime('Invalid period start date format'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large')
    .optional(),
  includeSubcategories: z.boolean().optional(),
  name: z.string().max(100).optional(),
  notes: z.string().max(500).nullable().optional(),
});

/**
 * Update override schema
 * Used when updating an existing override budget
 */
export const updateOverrideSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large')
    .optional(),
  includeSubcategories: z.boolean().optional(),
  name: z.string().max(100).optional(),
  notes: z.string().max(500).nullable().optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateBudgetTemplateDto = z.infer<typeof createBudgetTemplateSchema>;
export type UpdateBudgetTemplateDto = z.infer<typeof updateBudgetTemplateSchema>;
export type CreateOverrideDto = z.infer<typeof createOverrideSchema>;
export type UpdateOverrideDto = z.infer<typeof updateOverrideSchema>;
