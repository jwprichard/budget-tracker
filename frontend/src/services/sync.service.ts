import apiClient from './api';
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/sync';

/**
 * Bank Connection Types
 */
export interface BankConnection {
  connectionId: string;
  provider: string;
  status: string;
  createdAt: string;
}

export interface SetupConnectionDto {
  provider: string;
  appToken: string;
  userToken: string;
  metadata?: Record<string, any>;
}

export interface TestConnectionDto {
  connectionId: string;
}

export interface TestConnectionResponse {
  success: boolean;
  connectionId: string;
  provider: string;
  meData: any;
}

/**
 * Linked Account Types
 */
export interface LinkedAccount {
  id: string;
  externalAccountId: string;
  externalName: string;
  externalType: string;
  institution: string;
  accountNumber?: string;
  localAccount: {
    id: string;
    name: string;
    type: string;
  } | null;
  syncEnabled: boolean;
  lastSync?: string;
}

export interface LinkAccountDto {
  linkedAccountId: string;
  localAccountId: string;
}

/**
 * Sync Types
 */
export interface TriggerSyncDto {
  connectionId: string;
  options?: {
    startDate?: string;
    endDate?: string;
    forceFull?: boolean;
  };
}

export interface SyncStatus {
  id: string;
  status: string;
  type: string;
  startedAt: string;
  completedAt?: string;
  accountsSynced: number;
  transactionsFetched: number;
  transactionsImported: number;
  duplicatesDetected: number;
  needsReview: number;
  errorMessage?: string;
}

export interface SyncHistory {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  accountsSynced: number;
  transactionsFetched: number;
  transactionsImported: number;
  duplicatesDetected: number;
  needsReview: number;
}

export interface SyncHistoryResponse {
  items: SyncHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Transaction Review Types
 */
export interface ExternalTransaction {
  id: string;
  externalTransactionId: string;
  date: string;
  amount: number;
  description: string;
  merchant?: string;
  category?: string;
  duplicateConfidence?: number;
  potentialDuplicate?: {
    id: string;
    date: string;
    description: string;
    confidence: number;
  };
  account: {
    externalName: string;
    localName?: string;
  };
}

/**
 * Get all bank connections
 */
export const getConnections = async (): Promise<BankConnection[]> => {
  const response = await apiClient.get<{ items: BankConnection[] }>(`${BASE_PATH}/connections`);
  return response.data.items;
};

/**
 * Setup a new bank connection
 */
export const setupConnection = async (data: SetupConnectionDto): Promise<BankConnection> => {
  const response = await apiClient.post<BankConnection>(`${BASE_PATH}/setup`, data);
  return response.data;
};

/**
 * Test connection by calling /v1/me endpoint
 */
export const testConnection = async (data: TestConnectionDto): Promise<TestConnectionResponse> => {
  const response = await apiClient.post<TestConnectionResponse>(`${BASE_PATH}/test`, data);
  return response.data;
};

/**
 * Get connected accounts for a connection
 */
export const getConnectedAccounts = async (connectionId: string): Promise<LinkedAccount[]> => {
  const response = await apiClient.get<{ items: LinkedAccount[] }>(`${BASE_PATH}/accounts`, {
    params: { connectionId },
  });
  return response.data.items;
};

/**
 * Link external account to local account
 */
export const linkAccount = async (data: LinkAccountDto): Promise<{ success: boolean; linkedAccount: LinkedAccount }> => {
  const response = await apiClient.post<{ success: boolean; linkedAccount: LinkedAccount }>(`${BASE_PATH}/link-account`, data);
  return response.data;
};

/**
 * Unlink external account from local account
 */
export const unlinkAccount = async (localAccountId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(`${BASE_PATH}/unlink-account`, { localAccountId });
  return response.data;
};

/**
 * Trigger sync for a connection
 */
export const triggerSync = async (data: TriggerSyncDto): Promise<{ syncHistoryId?: string; status: string; startedAt?: string }> => {
  const response = await apiClient.post<{ syncHistoryId?: string; status: string; startedAt?: string }>(`${BASE_PATH}/trigger`, data);
  return response.data;
};

/**
 * Get sync status by sync history ID
 */
export const getSyncStatus = async (syncHistoryId: string): Promise<SyncStatus> => {
  const response = await apiClient.get<SyncStatus>(`${BASE_PATH}/status/${syncHistoryId}`);
  return response.data;
};

/**
 * Get sync history
 */
export const getSyncHistory = async (
  connectionId?: string,
  page = 1,
  pageSize = 20
): Promise<SyncHistoryResponse> => {
  const response = await apiClient.get<SyncHistoryResponse>(`${BASE_PATH}/history`, {
    params: { connectionId, page, pageSize },
  });
  return response.data;
};

/**
 * Get transactions needing review
 */
export const getReviewTransactions = async (connectionId: string): Promise<ExternalTransaction[]> => {
  const response = await apiClient.get<{ items: ExternalTransaction[] }>(`${BASE_PATH}/review`, {
    params: { connectionId },
  });
  return response.data.items;
};

/**
 * Approve transaction (import as new)
 */
export const approveTransaction = async (externalTransactionId: string): Promise<{ success: boolean; localTransaction: any }> => {
  const response = await apiClient.post<{ success: boolean; localTransaction: any }>(
    `${BASE_PATH}/review/${externalTransactionId}/approve`
  );
  return response.data;
};

/**
 * Reject transaction (mark as duplicate, don't import)
 */
export const rejectTransaction = async (externalTransactionId: string): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    `${BASE_PATH}/review/${externalTransactionId}/reject`
  );
  return response.data;
};

/**
 * Link transaction to existing local transaction
 */
export const linkTransaction = async (
  externalTransactionId: string,
  localTransactionId: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    `${BASE_PATH}/review/${externalTransactionId}/link`,
    { localTransactionId }
  );
  return response.data;
};
