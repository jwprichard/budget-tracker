/**
 * Zod validation schemas for budget API endpoints
 */

import { z } from 'zod';

/**
 * Budget period enum schema
 */
export const budgetPeriodSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']);

/**
 * Create budget request schema with validation
 */
export const createBudgetSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z
      .number()
      .positive('Amount must be positive')
      .max(1000000000, 'Amount too large'),
    periodType: budgetPeriodSchema,
    periodYear: z.number().int().min(2000).max(2100),
    periodNumber: z.number().int().min(1).max(53),
    includeSubcategories: z.boolean().default(false),
    name: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Validate periodNumber based on periodType
      if (
        data.periodType === 'MONTHLY' &&
        (data.periodNumber < 1 || data.periodNumber > 12)
      ) {
        return false;
      }
      if (
        data.periodType === 'QUARTERLY' &&
        (data.periodNumber < 1 || data.periodNumber > 4)
      ) {
        return false;
      }
      if (data.periodType === 'ANNUALLY' && data.periodNumber !== 1) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid period number for the selected period type',
    }
  );

/**
 * Update budget request schema
 * Only allows updating amount, includeSubcategories, name, and notes
 * Period and category cannot be changed
 */
export const updateBudgetSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000000, 'Amount too large')
    .optional(),
  includeSubcategories: z.boolean().optional(),
  name: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Budget query parameters schema
 */
export const budgetQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  periodType: budgetPeriodSchema.optional(),
  periodYear: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .optional(),
  periodNumber: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .optional(),
  includeStatus: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  templateId: z.string().uuid().optional(), // Filter budgets by template
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryDto = z.infer<typeof budgetQuerySchema>;
