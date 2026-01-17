/**
 * Zod validation schemas for budget API endpoints
 */

import { z } from 'zod';

/**
 * Budget period enum schema
 */
export const budgetPeriodSchema = z.enum(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'ANNUALLY']);

/**
 * Create budget request schema with validation
 * Supports both one-time budgets (startDate only) and recurring budgets (startDate + periodType + interval)
 */
export const createBudgetSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z
      .number()
      .positive('Amount must be positive')
      .max(1000000000, 'Amount too large'),
    includeSubcategories: z.boolean().default(false),
    name: z.string().min(1).max(100).optional(),
    notes: z.string().max(500).optional(),

    // Required
    startDate: z.string().datetime('Invalid start date format'),

    // Optional - both must be present or both absent (recurring vs one-time)
    periodType: budgetPeriodSchema.optional(),
    interval: z.number().int().min(1).max(365).optional(),
  })
  .refine(
    (data) => {
      // Both periodType and interval must be present, or both absent
      const hasPeriod = !!data.periodType;
      const hasInterval = !!data.interval;
      return hasPeriod === hasInterval;
    },
    {
      message: 'periodType and interval must both be provided for recurring budgets, or both omitted for one-time budgets',
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
  templateId: z.string().uuid().optional(),

  // NEW: Filter by date range
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // NEW: Filter one-time vs recurring
  isRecurring: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  includeStatus: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryDto = z.infer<typeof budgetQuerySchema>;
