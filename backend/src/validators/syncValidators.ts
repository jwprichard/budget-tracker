import { z } from 'zod';

/**
 * Validation schemas for sync API endpoints
 * Uses Zod for type-safe request validation
 */

/**
 * Test connection request
 * POST /api/v1/sync/test
 */
export const testConnectionSchema = z.object({
  body: z.object({
    connectionId: z.string().uuid('Invalid connection ID'),
  }),
});

/**
 * Setup connection request
 * POST /api/v1/sync/setup
 */
export const setupConnectionSchema = z.object({
  body: z.object({
    provider: z
      .string()
      .min(1, 'Provider is required')
      .refine((val) => ['AKAHU_PERSONAL'].includes(val), {
        message: 'Unsupported provider. Currently supported: AKAHU_PERSONAL',
      }),
    appToken: z
      .string()
      .min(1, 'App token is required')
      .max(1000, 'App token too long'),
    userToken: z
      .string()
      .min(1, 'User token is required')
      .max(1000, 'User token too long'),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Link account request
 * POST /api/v1/sync/link-account
 */
export const linkAccountSchema = z.object({
  body: z.object({
    linkedAccountId: z.string().uuid('Invalid linked account ID'),
    localAccountId: z.string().uuid('Invalid local account ID'),
  }),
});

/**
 * Trigger sync request
 * POST /api/v1/sync/trigger
 */
export const triggerSyncSchema = z.object({
  body: z.object({
    connectionId: z.string().uuid('Invalid connection ID'),
    options: z
      .object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        forceFull: z.boolean().optional(),
      })
      .optional(),
  }),
});

/**
 * Get sync status request
 * GET /api/v1/sync/status/:syncHistoryId
 */
export const getSyncStatusSchema = z.object({
  params: z.object({
    syncHistoryId: z.string().uuid('Invalid sync history ID'),
  }),
});

/**
 * Get sync history request
 * GET /api/v1/sync/history
 */
export const getSyncHistorySchema = z.object({
  query: z.object({
    connectionId: z.string().uuid('Invalid connection ID').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    pageSize: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('20')
      .refine((val) => val <= 100, {
        message: 'Page size cannot exceed 100',
      }),
  }),
});

/**
 * Get transactions needing review
 * GET /api/v1/sync/review
 */
export const getReviewTransactionsSchema = z.object({
  query: z.object({
    connectionId: z.string().uuid('Invalid connection ID'),
  }),
});

/**
 * Approve transaction request
 * POST /api/v1/sync/review/:externalTransactionId/approve
 */
export const approveTransactionSchema = z.object({
  params: z.object({
    externalTransactionId: z.string().uuid('Invalid external transaction ID'),
  }),
});

/**
 * Reject transaction request
 * POST /api/v1/sync/review/:externalTransactionId/reject
 */
export const rejectTransactionSchema = z.object({
  params: z.object({
    externalTransactionId: z.string().uuid('Invalid external transaction ID'),
  }),
});

/**
 * Link transaction request
 * POST /api/v1/sync/review/:externalTransactionId/link
 */
export const linkTransactionSchema = z.object({
  params: z.object({
    externalTransactionId: z.string().uuid('Invalid external transaction ID'),
  }),
  body: z.object({
    localTransactionId: z.string().uuid('Invalid local transaction ID'),
  }),
});

/**
 * Get connected accounts request
 * GET /api/v1/sync/accounts
 */
export const getConnectedAccountsSchema = z.object({
  query: z.object({
    connectionId: z.string().uuid('Invalid connection ID'),
  }),
});

// Export types for TypeScript
export type SetupConnectionInput = z.infer<typeof setupConnectionSchema>['body'];
export type LinkAccountInput = z.infer<typeof linkAccountSchema>['body'];
export type TriggerSyncInput = z.infer<typeof triggerSyncSchema>['body'];
