/**
 * Matching Zod Schemas
 * Validation schemas for transaction matching operations
 */

import { z } from 'zod';

// ============================================================================
// Query Schemas
// ============================================================================

export const getPendingMatchesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
});

export const getMatchHistoryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
});

// ============================================================================
// Request Body Schemas
// ============================================================================

export const confirmMatchBodySchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  plannedTransactionId: z.string().min(1, 'Planned transaction ID is required'),
});

export const dismissMatchBodySchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  plannedTransactionId: z.string().min(1, 'Planned transaction ID is required'),
});

export const manualMatchBodySchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  plannedTransactionId: z.string().min(1, 'Planned transaction ID is required'),
});

export const batchAutoMatchBodySchema = z.object({
  transactionIds: z
    .array(z.string().uuid('Invalid transaction ID'))
    .min(1, 'At least one transaction ID is required')
    .max(100, 'Maximum 100 transactions per batch'),
});

export const autoMatchBodySchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
});

// ============================================================================
// Param Schemas
// ============================================================================

export const matchIdParamSchema = z.object({
  matchId: z.string().uuid('Invalid match ID'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type GetPendingMatchesQuery = z.infer<typeof getPendingMatchesQuerySchema>;
export type GetMatchHistoryQuery = z.infer<typeof getMatchHistoryQuerySchema>;
export type ConfirmMatchBody = z.infer<typeof confirmMatchBodySchema>;
export type DismissMatchBody = z.infer<typeof dismissMatchBodySchema>;
export type ManualMatchBody = z.infer<typeof manualMatchBodySchema>;
export type BatchAutoMatchBody = z.infer<typeof batchAutoMatchBodySchema>;
export type AutoMatchBody = z.infer<typeof autoMatchBodySchema>;
export type MatchIdParam = z.infer<typeof matchIdParamSchema>;
