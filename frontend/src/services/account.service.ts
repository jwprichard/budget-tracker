import apiClient from './api';
import {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountBalance,
  SuccessResponse,
  PaginatedResponse,
  Transaction,
} from '../types';

const BASE_PATH = '/v1/accounts';

/**
 * Get all accounts
 * @param includeInactive - Whether to include inactive accounts
 */
export const getAllAccounts = async (includeInactive = false): Promise<Account[]> => {
  const response = await apiClient.get<SuccessResponse<Account[]>>(BASE_PATH, {
    params: { includeInactive },
  });
  return response.data.data;
};

/**
 * Get account by ID
 * @param id - Account UUID
 */
export const getAccountById = async (id: string): Promise<Account> => {
  const response = await apiClient.get<SuccessResponse<Account>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Create a new account
 * @param data - Account creation data
 */
export const createAccount = async (data: CreateAccountDto): Promise<Account> => {
  const response = await apiClient.post<SuccessResponse<Account>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Update an account
 * @param id - Account UUID
 * @param data - Account update data
 */
export const updateAccount = async (id: string, data: UpdateAccountDto): Promise<Account> => {
  const response = await apiClient.put<SuccessResponse<Account>>(`${BASE_PATH}/${id}`, data);
  return response.data.data;
};

/**
 * Delete an account
 * Soft deletes if has transactions, hard deletes if empty
 * @param id - Account UUID
 */
export const deleteAccount = async (id: string): Promise<Account> => {
  const response = await apiClient.delete<SuccessResponse<Account>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Get account balance (calculated from transactions)
 * @param id - Account UUID
 */
export const getAccountBalance = async (id: string): Promise<AccountBalance> => {
  const response = await apiClient.get<SuccessResponse<AccountBalance>>(`${BASE_PATH}/${id}/balance`);
  return response.data.data;
};

/**
 * Get transactions for an account (paginated)
 * @param id - Account UUID
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 50)
 */
export const getAccountTransactions = async (
  id: string,
  page = 1,
  pageSize = 50
): Promise<{ transactions: Transaction[]; pagination: PaginatedResponse<Transaction>['pagination'] }> => {
  const response = await apiClient.get<PaginatedResponse<Transaction>>(`${BASE_PATH}/${id}/transactions`, {
    params: { page, pageSize },
  });
  return {
    transactions: response.data.data,
    pagination: response.data.pagination,
  };
};
