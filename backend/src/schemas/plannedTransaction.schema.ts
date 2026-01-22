/**
 * Zod validation schemas for planned transaction API endpoints
 */

import { z } from 'zod';
import { budgetPeriodSchema } from './budget.schema';
import { transactionTypeEnum } from './transaction.schema';

/**
 * Day of month type enum for floating day calculations
 */
export const dayOfMonthTypeSchema = z.enum([
  'FIXED',         // Use dayOfMonth field (1-31)
  'LAST_DAY',      // Last day of month
  'FIRST_WEEKDAY', // First Monday-Friday of month
  'LAST_WEEKDAY',  // Last Monday-Friday of month
  'FIRST_OF_WEEK', // First occurrence of dayOfWeek in month
  'LAST_OF_WEEK',  // Last occurrence of dayOfWeek in month
]);

/**
 * Implicit spend mode enum for budget forecasting
 */
export const implicitSpendModeSchema = z.enum([
  'DAILY',        // Spread evenly across days in period
  'END_OF_PERIOD', // Assume spent at end of period
  'NONE',         // Don't include in forecast (tracking only)
]);

/**
 * Match method enum for transaction matching
 */
export const matchMethodSchema = z.enum([
  'AUTO',          // System auto-matched, high confidence
  'AUTO_REVIEWED', // System suggested, user confirmed
  'MANUAL',        // User manually linked
]);

/**
 * Base schema for matching configuration
 */
const matchingConfigSchema = z.object({
  autoMatchEnabled: z.boolean().default(true),
  skipReview: z.boolean().default(false),
  matchTolerance: z.number().min(0).max(1000000).optional(),
  matchWindowDays: z.number().int().min(1).max(365).default(7),
});

/**
 * Create planned transaction template schema
 * Used for recurring planned transactions
 */
export const createPlannedTransactionTemplateSchema = z
  .object({
    // Transaction details
    accountId: z.string().uuid('Invalid account ID'),
    categoryId: z.string().uuid('Invalid category ID').optional(),

    // For transfers
    isTransfer: z.boolean().default(false),
    transferToAccountId: z.string().uuid('Invalid transfer destination account ID').optional(),

    // Amount and type
    amount: z.number().finite('Amount must be a valid number'),
    type: transactionTypeEnum,

    // Description
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),

    // Recurrence pattern
    periodType: budgetPeriodSchema,
    interval: z.number().int().min(1).max(365).default(1),
    firstOccurrence: z.string().datetime('Invalid date format'),
    endDate: z.string().datetime('Invalid date format').optional(),

    // Day-of-period specification
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    dayOfMonthType: dayOfMonthTypeSchema.optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(), // 0=Sunday, 6=Saturday

    // Matching configuration
    ...matchingConfigSchema.shape,

    // Budget linkage
    budgetId: z.string().uuid('Invalid budget ID').optional(),
  })
  .refine(
    (data) => {
      // If isTransfer is true, transferToAccountId must be provided
      if (data.isTransfer && !data.transferToAccountId) {
        return false;
      }
      // If isTransfer is true, type must be TRANSFER
      if (data.isTransfer && data.type !== 'TRANSFER') {
        return false;
      }
      return true;
    },
    {
      message: 'Transfer transactions require transferToAccountId and type must be TRANSFER',
    }
  )
  .refine(
    (data) => {
      // transferToAccountId must be different from accountId
      if (data.transferToAccountId && data.accountId === data.transferToAccountId) {
        return false;
      }
      return true;
    },
    {
      message: 'Cannot transfer to the same account',
      path: ['transferToAccountId'],
    }
  )
  .refine(
    (data) => {
      // For monthly with dayOfMonthType, validate combinations
      if (data.periodType === 'MONTHLY' && data.dayOfMonthType) {
        if (data.dayOfMonthType === 'FIXED' && !data.dayOfMonth) {
          return false;
        }
        if ((data.dayOfMonthType === 'FIRST_OF_WEEK' || data.dayOfMonthType === 'LAST_OF_WEEK') &&
            data.dayOfWeek === undefined) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Invalid day-of-month configuration',
    }
  );

/**
 * Update planned transaction template schema
 */
export const updatePlannedTransactionTemplateSchema = z
  .object({
    // Transaction details
    accountId: z.string().uuid('Invalid account ID').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),

    // For transfers
    isTransfer: z.boolean().optional(),
    transferToAccountId: z.string().uuid('Invalid transfer destination account ID').optional().nullable(),

    // Amount and type
    amount: z.number().finite('Amount must be a valid number').optional(),
    type: transactionTypeEnum.optional(),

    // Description
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: z.string().max(255).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),

    // Recurrence pattern
    interval: z.number().int().min(1).max(365).optional(),
    firstOccurrence: z.string().datetime('Invalid date format').optional(),
    endDate: z.string().datetime('Invalid date format').optional().nullable(),

    // Day-of-period specification
    dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
    dayOfMonthType: dayOfMonthTypeSchema.optional().nullable(),
    dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),

    // Matching configuration
    autoMatchEnabled: z.boolean().optional(),
    skipReview: z.boolean().optional(),
    matchTolerance: z.number().min(0).max(1000000).optional().nullable(),
    matchWindowDays: z.number().int().min(1).max(365).optional(),

    // Budget linkage
    budgetId: z.string().uuid('Invalid budget ID').optional().nullable(),

    // Status
    isActive: z.boolean().optional(),
  });

/**
 * Create planned transaction schema
 * Used for one-time planned transactions or overrides to template instances
 */
export const createPlannedTransactionSchema = z
  .object({
    // Link to template (optional - null for one-time planned transactions)
    templateId: z.string().uuid('Invalid template ID').optional(),

    // Transaction details
    accountId: z.string().uuid('Invalid account ID'),
    categoryId: z.string().uuid('Invalid category ID').optional(),

    // For transfers
    isTransfer: z.boolean().default(false),
    transferToAccountId: z.string().uuid('Invalid transfer destination account ID').optional(),

    // Amount and type
    amount: z.number().finite('Amount must be a valid number'),
    type: transactionTypeEnum,

    // Description
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().max(255).optional(),
    notes: z.string().max(1000).optional(),

    // Timing
    expectedDate: z.string().datetime('Invalid expected date format'),

    // Override flag
    isOverride: z.boolean().default(false),

    // Matching configuration
    ...matchingConfigSchema.shape,

    // Budget linkage
    budgetId: z.string().uuid('Invalid budget ID').optional(),
  })
  .refine(
    (data) => {
      // If isTransfer is true, transferToAccountId must be provided
      if (data.isTransfer && !data.transferToAccountId) {
        return false;
      }
      // If isTransfer is true, type must be TRANSFER
      if (data.isTransfer && data.type !== 'TRANSFER') {
        return false;
      }
      return true;
    },
    {
      message: 'Transfer transactions require transferToAccountId and type must be TRANSFER',
    }
  )
  .refine(
    (data) => {
      // transferToAccountId must be different from accountId
      if (data.transferToAccountId && data.accountId === data.transferToAccountId) {
        return false;
      }
      return true;
    },
    {
      message: 'Cannot transfer to the same account',
      path: ['transferToAccountId'],
    }
  )
  .refine(
    (data) => {
      // If isOverride is true, templateId must be provided
      if (data.isOverride && !data.templateId) {
        return false;
      }
      return true;
    },
    {
      message: 'Override planned transactions require a templateId',
    }
  );

/**
 * Update planned transaction schema
 */
export const updatePlannedTransactionSchema = z.object({
  // Transaction details
  accountId: z.string().uuid('Invalid account ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),

  // For transfers
  isTransfer: z.boolean().optional(),
  transferToAccountId: z.string().uuid('Invalid transfer destination account ID').optional().nullable(),

  // Amount and type
  amount: z.number().finite('Amount must be a valid number').optional(),
  type: transactionTypeEnum.optional(),

  // Description
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),

  // Timing
  expectedDate: z.string().datetime('Invalid expected date format').optional(),

  // Matching configuration
  autoMatchEnabled: z.boolean().optional(),
  skipReview: z.boolean().optional(),
  matchTolerance: z.number().min(0).max(1000000).optional().nullable(),
  matchWindowDays: z.number().int().min(1).max(365).optional(),

  // Budget linkage
  budgetId: z.string().uuid('Invalid budget ID').optional().nullable(),
});

/**
 * Query schema for listing planned transaction templates
 */
export const plannedTransactionTemplateQuerySchema = z.object({
  accountId: z.string().uuid('Invalid account ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  type: transactionTypeEnum.optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  budgetId: z.string().uuid('Invalid budget ID').optional(),
});

/**
 * Query schema for listing planned transactions (one-time and overrides)
 * Also used for fetching occurrences in a date range
 */
export const plannedTransactionQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  accountId: z.string().uuid('Invalid account ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  type: transactionTypeEnum.optional(),
  templateId: z.string().uuid('Invalid template ID').optional(),
  includeVirtual: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

/**
 * Query schema for fetching template occurrences
 */
export const templateOccurrencesQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
});

/**
 * Schema for skipping a specific occurrence
 */
export const skipOccurrenceSchema = z.object({
  date: z.string().datetime('Invalid date format'),
});

/**
 * Forecast query schema
 */
export const forecastQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  days: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(730)) // Max 2 years
    .optional()
    .default('90'),
  accountIds: z.string().optional(), // Comma-separated UUIDs
});

/**
 * Low balance warning query schema
 */
export const lowBalanceWarningQuerySchema = z.object({
  threshold: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().finite())
    .optional()
    .default('0'),
  days: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(365))
    .optional()
    .default('90'),
});

/**
 * Match confirmation schema
 */
export const confirmMatchSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  plannedTransactionId: z.string().min(1, 'Planned transaction ID is required'), // Can be virtual ID
  matchMethod: matchMethodSchema.default('AUTO_REVIEWED'),
});

/**
 * Manual match schema
 */
export const manualMatchSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  plannedTransactionId: z.string().min(1, 'Planned transaction ID is required'), // Can be virtual ID
});

/**
 * TypeScript types inferred from schemas
 */
export type DayOfMonthType = z.infer<typeof dayOfMonthTypeSchema>;
export type ImplicitSpendMode = z.infer<typeof implicitSpendModeSchema>;
export type MatchMethod = z.infer<typeof matchMethodSchema>;
export type CreatePlannedTransactionTemplateDto = z.infer<typeof createPlannedTransactionTemplateSchema>;
export type UpdatePlannedTransactionTemplateDto = z.infer<typeof updatePlannedTransactionTemplateSchema>;
export type CreatePlannedTransactionDto = z.infer<typeof createPlannedTransactionSchema>;
export type UpdatePlannedTransactionDto = z.infer<typeof updatePlannedTransactionSchema>;
export type PlannedTransactionTemplateQuery = z.infer<typeof plannedTransactionTemplateQuerySchema>;
export type PlannedTransactionQuery = z.infer<typeof plannedTransactionQuerySchema>;
export type TemplateOccurrencesQuery = z.infer<typeof templateOccurrencesQuerySchema>;
export type SkipOccurrenceDto = z.infer<typeof skipOccurrenceSchema>;
export type ForecastQuery = z.infer<typeof forecastQuerySchema>;
export type LowBalanceWarningQuery = z.infer<typeof lowBalanceWarningQuerySchema>;
export type ConfirmMatchDto = z.infer<typeof confirmMatchSchema>;
export type ManualMatchDto = z.infer<typeof manualMatchSchema>;
