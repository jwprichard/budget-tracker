import apiClient from './api';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateTransferDto,
  TransferResult,
  TransactionQuery,
  SuccessResponse,
  PaginatedResponse,
} from '../types';

const BASE_PATH = '/v1/transactions';

/**
 * Get all transactions with filtering and pagination
 * @param query - Query parameters for filtering, sorting, and pagination
 */
export const getAllTransactions = async (
  query?: TransactionQuery
): Promise<{ transactions: Transaction[]; pagination: PaginatedResponse<Transaction>['pagination'] }> => {
  const response = await apiClient.get<PaginatedResponse<Transaction>>(BASE_PATH, {
    params: query,
  });
  return {
    transactions: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Get transaction by ID
 * @param id - Transaction UUID
 */
export const getTransactionById = async (id: string): Promise<Transaction> => {
  const response = await apiClient.get<SuccessResponse<Transaction>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Create a new transaction (income or expense)
 * @param data - Transaction creation data
 */
export const createTransaction = async (data: CreateTransactionDto): Promise<Transaction> => {
  const response = await apiClient.post<SuccessResponse<Transaction>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Create a transfer between two accounts
 * Creates two linked transactions (expense from source, income to destination)
 * @param data - Transfer creation data
 */
export const createTransfer = async (data: CreateTransferDto): Promise<TransferResult> => {
  const response = await apiClient.post<SuccessResponse<TransferResult>>(`${BASE_PATH}/transfer`, data);
  return response.data.data;
};

/**
 * Update a transaction
 * Note: Transfer transactions cannot be updated directly
 * @param id - Transaction UUID
 * @param data - Transaction update data
 */
export const updateTransaction = async (id: string, data: UpdateTransactionDto): Promise<Transaction> => {
  const response = await apiClient.put<SuccessResponse<Transaction>>(`${BASE_PATH}/${id}`, data);
  return response.data.data;
};

/**
 * Delete a transaction
 * If it's a transfer, deletes both linked transactions
 * @param id - Transaction UUID
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  await apiClient.delete<SuccessResponse<void>>(`${BASE_PATH}/${id}`);
};

/**
 * Parse CSV file and return raw data
 * @param file - CSV file to parse
 */
export const parseCSV = async (file: File): Promise<{ headers: string[]; rows: string[][]; rowCount: number }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<SuccessResponse<{ headers: string[]; rows: string[][]; rowCount: number }>>(
    `${BASE_PATH}/parse-csv`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
};

/**
 * Bulk import transactions
 * @param accountId - Account ID to import into
 * @param transactions - Array of transactions to import
 * @param skipDuplicates - Whether to skip duplicate transactions
 */
export const bulkImport = async (
  accountId: string,
  transactions: Array<{
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    date: string;
    description: string;
    notes?: string;
    status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
  }>,
  skipDuplicates = true
): Promise<{
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}> => {
  const response = await apiClient.post<
    SuccessResponse<{
      imported: number;
      skipped: number;
      errors: Array<{ row: number; message: string }>;
    }>
  >(`${BASE_PATH}/bulk-import`, {
    accountId,
    transactions,
    skipDuplicates,
  });

  return response.data.data;
};
