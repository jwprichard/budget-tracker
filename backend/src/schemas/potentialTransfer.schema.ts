/**
 * Zod schemas for potential transfer endpoints
 */

import { z } from 'zod';

// Query schema for detecting transfers
const detectTransfersQueryInner = z.object({
  daysBack: z.coerce.number().min(1).max(365).optional().default(30),
});

// Full validation schema for detect endpoint (wrapped for validate middleware)
export const detectTransfersSchema = z.object({
  query: detectTransfersQueryInner,
});

export type DetectTransfersQuery = z.infer<typeof detectTransfersQueryInner>;

// Params schema for single potential transfer operations
const potentialTransferIdParamInner = z.object({
  id: z.string().uuid(),
});

// Full validation schema for ID param endpoints (wrapped for validate middleware)
export const potentialTransferIdSchema = z.object({
  params: potentialTransferIdParamInner,
});

export type PotentialTransferIdParam = z.infer<typeof potentialTransferIdParamInner>;
