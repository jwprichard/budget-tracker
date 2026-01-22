/**
 * Matching Service
 * API client methods for transaction matching operations
 */

import apiClient from './api';
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
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/matching';

/**
 * Get pending match suggestions for review
 * @param query - Optional query parameters (limit)
 */
export const getPendingMatches = async (
  query?: PendingMatchesQuery
): Promise<PendingMatch[]> => {
  const response = await apiClient.get<SuccessResponse<PendingMatch[]>>(
    `${BASE_PATH}/pending`,
    { params: query }
  );
  return response.data.data;
};

/**
 * Get match history
 * @param query - Query parameters (startDate, endDate, limit, offset)
 */
export const getMatchHistory = async (
  query?: MatchHistoryQuery
): Promise<{
  items: MatchHistoryItem[];
  pagination: { total: number; limit: number; offset: number };
}> => {
  const response = await apiClient.get<
    SuccessResponse<MatchHistoryItem[]> & {
      pagination: { total: number; limit: number; offset: number };
    }
  >(`${BASE_PATH}/history`, { params: query });
  return {
    items: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Confirm a suggested match
 * @param data - Transaction and planned transaction IDs
 */
export const confirmMatch = async (
  data: ConfirmMatchRequest
): Promise<{ id: string }> => {
  const response = await apiClient.post<SuccessResponse<{ id: string }>>(
    `${BASE_PATH}/confirm`,
    data
  );
  return response.data.data;
};

/**
 * Dismiss a suggested match
 * @param data - Transaction and planned transaction IDs
 */
export const dismissMatch = async (data: DismissMatchRequest): Promise<void> => {
  await apiClient.post(`${BASE_PATH}/dismiss`, data);
};

/**
 * Manually link a transaction to a planned transaction
 * @param data - Transaction and planned transaction IDs
 */
export const manualMatch = async (
  data: ManualMatchRequest
): Promise<{ id: string }> => {
  const response = await apiClient.post<SuccessResponse<{ id: string }>>(
    `${BASE_PATH}/manual`,
    data
  );
  return response.data.data;
};

/**
 * Auto-match a single transaction
 * @param data - Transaction ID
 */
export const autoMatch = async (
  data: AutoMatchRequest
): Promise<AutoMatchResult> => {
  const response = await apiClient.post<SuccessResponse<AutoMatchResult>>(
    `${BASE_PATH}/auto`,
    data
  );
  return response.data.data;
};

/**
 * Batch auto-match multiple transactions
 * @param data - Array of transaction IDs
 */
export const batchAutoMatch = async (
  data: BatchAutoMatchRequest
): Promise<BatchAutoMatchResult> => {
  const response = await apiClient.post<SuccessResponse<BatchAutoMatchResult>>(
    `${BASE_PATH}/auto/batch`,
    data
  );
  return response.data.data;
};

/**
 * Undo a match (unmatch)
 * @param matchId - Match record ID
 */
export const unmatch = async (matchId: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/${matchId}`);
};

export const matchingService = {
  getPendingMatches,
  getMatchHistory,
  confirmMatch,
  dismissMatch,
  manualMatch,
  autoMatch,
  batchAutoMatch,
  unmatch,
};

export default matchingService;
