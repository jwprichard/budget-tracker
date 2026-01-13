import { z } from 'zod';

/**
 * Analytics Schema Validation
 * Zod schemas for validating analytics API requests
 */

// Helper schemas
const dateStringSchema = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
const uuidArraySchema = z.string().transform((val) => val.split(',').filter(Boolean));

// Daily balances query schema
export const dailyBalancesQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  accountIds: uuidArraySchema.optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: 'startDate must be before or equal to endDate',
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365;
  },
  {
    message: 'Date range cannot exceed 365 days',
  }
);

// Category totals query schema
export const categoryTotalsQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  accountIds: uuidArraySchema.optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'ALL']).default('EXPENSE'),
  includeSubcategories: z.string().transform((val) => val === 'true').default('true'),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: 'startDate must be before or equal to endDate',
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365;
  },
  {
    message: 'Date range cannot exceed 365 days',
  }
);

// Spending trends query schema
export const spendingTrendsQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  accountIds: uuidArraySchema.optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  categoryIds: uuidArraySchema.optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: 'startDate must be before or equal to endDate',
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 365;
  },
  {
    message: 'Date range cannot exceed 365 days',
  }
);

// Income vs expense query schema (same as spending trends)
export const incomeVsExpenseQuerySchema = spendingTrendsQuerySchema;

// Type exports for controller use
export type DailyBalancesQuery = z.infer<typeof dailyBalancesQuerySchema>;
export type CategoryTotalsQuery = z.infer<typeof categoryTotalsQuerySchema>;
export type SpendingTrendsQuery = z.infer<typeof spendingTrendsQuerySchema>;
export type IncomeVsExpenseQuery = z.infer<typeof incomeVsExpenseQuerySchema>;
