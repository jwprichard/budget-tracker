/**
 * Zod validation schemas for budget template API endpoints
 */

import { z } from 'zod';
import { budgetPeriodSchema } from './budget.schema';

/**
 * Create budget template request schema with validation
 */
export const createBudgetTemplateSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z
      .number()
      .positive('Amount must be positive')
      .max(1000000000, 'Amount too large'),
    periodType: budgetPeriodSchema,
    startYear: z.number().int().min(2000).max(2100),
    startNumber: z.number().int().min(1).max(53),
    endDate: z.string().datetime().optional(),
    includeSubcategories: z.boolean().default(false),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Validate periodNumber based on periodType
      if (
        data.periodType === 'MONTHLY' &&
        (data.startNumber < 1 || data.startNumber > 12)
      ) {
        return false;
      }
      if (
        data.periodType === 'QUARTERLY' &&
        (data.startNumber < 1 || data.startNumber > 4)
      ) {
        return false;
      }
      if (data.periodType === 'ANNUALLY' && data.startNumber !== 1) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid period number for the selected period type',
    }
  );

/**
 * Update budget template request schema
 */
export const updateBudgetTemplateSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large')
    .optional(),
  includeSubcategories: z.boolean().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  notes: z.string().max(500).nullable().optional(),
});

/**
 * Update budget instance with scope schema
 */
export const updateBudgetInstanceSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large')
    .optional(),
  includeSubcategories: z.boolean().optional(),
  name: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  scope: z.enum(['THIS_ONLY', 'THIS_AND_FUTURE', 'ALL']),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateBudgetTemplateDto = z.infer<typeof createBudgetTemplateSchema>;
export type UpdateBudgetTemplateDto = z.infer<typeof updateBudgetTemplateSchema>;
export type UpdateBudgetInstanceDto = z.infer<typeof updateBudgetInstanceSchema>;
