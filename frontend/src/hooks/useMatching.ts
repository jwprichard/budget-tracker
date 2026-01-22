/**
 * React Query hooks for transaction matching
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  PendingMatch,
  MatchHistoryItem,
  AutoMatchResult,
  BatchAutoMatchResult,
  PendingMatchesQuery,
  MatchHistoryQuery,
  ConfirmMatchRequest,
  DismissMatchRequest,
  ManualMatchRequest,
  AutoMatchRequest,
  BatchAutoMatchRequest,
} from '../types/matching.types';
import {
  getPendingMatches,
  getMatchHistory,
  confirmMatch,
  dismissMatch,
  manualMatch,
  autoMatch,
  batchAutoMatch,
  unmatch,
} from '../services/matching.service';

// ============================================================================
// Query Keys
// ============================================================================

export const matchingKeys = {
  all: ['matching'] as const,
  pending: (query?: PendingMatchesQuery) => [...matchingKeys.all, 'pending', query] as const,
  history: (query?: MatchHistoryQuery) => [...matchingKeys.all, 'history', query] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch pending match suggestions for review
 */
export const usePendingMatches = (
  query?: PendingMatchesQuery,
  enabled: boolean = true
): UseQueryResult<PendingMatch[], Error> => {
  return useQuery({
    queryKey: matchingKeys.pending(query),
    queryFn: () => getPendingMatches(query),
    staleTime: 30 * 1000, // 30 seconds - matches change frequently
    enabled,
  });
};

/**
 * Fetch match history
 */
export const useMatchHistory = (
  query?: MatchHistoryQuery,
  enabled: boolean = true
): UseQueryResult<
  { items: MatchHistoryItem[]; pagination: { total: number; limit: number; offset: number } },
  Error
> => {
  return useQuery({
    queryKey: matchingKeys.history(query),
    queryFn: () => getMatchHistory(query),
    staleTime: 60 * 1000, // 1 minute
    enabled,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Confirm a suggested match
 */
export const useConfirmMatch = (): UseMutationResult<
  { id: string },
  Error,
  ConfirmMatchRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmMatch,
    onSuccess: () => {
      // Invalidate pending matches and history
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
      // Also invalidate transactions since they're now matched
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Invalidate planned transactions
      queryClient.invalidateQueries({ queryKey: ['planned-transactions'] });
    },
  });
};

/**
 * Dismiss a suggested match
 */
export const useDismissMatch = (): UseMutationResult<void, Error, DismissMatchRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissMatch,
    onSuccess: () => {
      // Invalidate pending matches
      queryClient.invalidateQueries({ queryKey: matchingKeys.pending() });
    },
  });
};

/**
 * Manually link a transaction to a planned transaction
 */
export const useManualMatch = (): UseMutationResult<
  { id: string },
  Error,
  ManualMatchRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: manualMatch,
    onSuccess: () => {
      // Invalidate all matching-related queries
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
      // Also invalidate transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Invalidate planned transactions
      queryClient.invalidateQueries({ queryKey: ['planned-transactions'] });
    },
  });
};

/**
 * Auto-match a single transaction
 */
export const useAutoMatch = (): UseMutationResult<AutoMatchResult, Error, AutoMatchRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: autoMatch,
    onSuccess: (result) => {
      if (result.matched) {
        // Invalidate matching and transaction queries if a match was made
        queryClient.invalidateQueries({ queryKey: matchingKeys.all });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['planned-transactions'] });
      }
    },
  });
};

/**
 * Batch auto-match multiple transactions
 */
export const useBatchAutoMatch = (): UseMutationResult<
  BatchAutoMatchResult,
  Error,
  BatchAutoMatchRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchAutoMatch,
    onSuccess: (result) => {
      if (result.matched > 0) {
        // Invalidate matching and transaction queries if any matches were made
        queryClient.invalidateQueries({ queryKey: matchingKeys.all });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['planned-transactions'] });
      }
    },
  });
};

/**
 * Undo a match (unmatch)
 */
export const useUnmatch = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unmatch,
    onSuccess: () => {
      // Invalidate all matching-related queries
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
      // Also invalidate transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
