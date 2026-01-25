/**
 * Potential Transfer Service
 * API client methods for potential transfer detection and review
 */

import apiClient from './api';
import {
  PotentialTransfer,
  DetectTransfersQuery,
  DetectTransfersResult,
  ConfirmTransferResult,
  PendingCountResult,
} from '../types/potentialTransfer.types';
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/potential-transfers';

/**
 * Detect potential transfers from recent transactions
 * @param query - Optional query parameters (daysBack)
 */
export const detectTransfers = async (
  query?: DetectTransfersQuery
): Promise<DetectTransfersResult> => {
  const response = await apiClient.post<SuccessResponse<DetectTransfersResult>>(
    `${BASE_PATH}/detect`,
    null,
    { params: query }
  );
  return response.data.data;
};

/**
 * Get pending potential transfers for review
 */
export const getPendingTransfers = async (): Promise<PotentialTransfer[]> => {
  const response = await apiClient.get<SuccessResponse<PotentialTransfer[]>>(
    `${BASE_PATH}/pending`
  );
  return response.data.data;
};

/**
 * Get count of pending potential transfers
 */
export const getPendingCount = async (): Promise<number> => {
  const response = await apiClient.get<SuccessResponse<PendingCountResult>>(
    `${BASE_PATH}/pending/count`
  );
  return response.data.data.count;
};

/**
 * Confirm a potential transfer - combine into single TRANSFER transaction
 * @param id - Potential transfer ID
 */
export const confirmTransfer = async (id: string): Promise<ConfirmTransferResult> => {
  const response = await apiClient.post<SuccessResponse<ConfirmTransferResult>>(
    `${BASE_PATH}/${id}/confirm`
  );
  return response.data.data;
};

/**
 * Dismiss a potential transfer - keep as separate transactions
 * @param id - Potential transfer ID
 */
export const dismissTransfer = async (id: string): Promise<void> => {
  await apiClient.post(`${BASE_PATH}/${id}/dismiss`);
};

export const potentialTransferService = {
  detectTransfers,
  getPendingTransfers,
  getPendingCount,
  confirmTransfer,
  dismissTransfer,
};

export default potentialTransferService;
