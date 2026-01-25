/**
 * React Query hooks for potential transfer detection and review
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  PotentialTransfer,
  DetectTransfersQuery,
  DetectTransfersResult,
  ConfirmTransferResult,
} from '../types/potentialTransfer.types';
import {
  detectTransfers,
  getPendingTransfers,
  getPendingCount,
  confirmTransfer,
  dismissTransfer,
} from '../services/potentialTransfer.service';

// ============================================================================
// Query Keys
// ============================================================================

export const potentialTransferKeys = {
  all: ['potential-transfers'] as const,
  pending: () => [...potentialTransferKeys.all, 'pending'] as const,
  pendingCount: () => [...potentialTransferKeys.all, 'pending-count'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch pending potential transfers for review
 */
export const usePendingTransfers = (
  enabled: boolean = true
): UseQueryResult<PotentialTransfer[], Error> => {
  return useQuery({
    queryKey: potentialTransferKeys.pending(),
    queryFn: getPendingTransfers,
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });
};

/**
 * Fetch count of pending potential transfers
 */
export const usePendingTransfersCount = (
  enabled: boolean = true
): UseQueryResult<number, Error> => {
  return useQuery({
    queryKey: potentialTransferKeys.pendingCount(),
    queryFn: getPendingCount,
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Detect potential transfers from recent transactions
 */
export const useDetectTransfers = (): UseMutationResult<
  DetectTransfersResult,
  Error,
  DetectTransfersQuery | undefined
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (query) => detectTransfers(query),
    onSuccess: () => {
      // Invalidate pending transfers and count
      queryClient.invalidateQueries({ queryKey: potentialTransferKeys.all });
    },
  });
};

/**
 * Confirm a potential transfer
 */
export const useConfirmTransfer = (): UseMutationResult<
  ConfirmTransferResult,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmTransfer,
    onSuccess: () => {
      // Invalidate potential transfers
      queryClient.invalidateQueries({ queryKey: potentialTransferKeys.all });
      // Also invalidate transactions since they're modified
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

/**
 * Dismiss a potential transfer
 */
export const useDismissTransfer = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissTransfer,
    onSuccess: () => {
      // Invalidate potential transfers
      queryClient.invalidateQueries({ queryKey: potentialTransferKeys.all });
    },
  });
};
