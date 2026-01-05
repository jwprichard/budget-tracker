import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  parseCSV,
  bulkImport,
} from '../services/transaction.service';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateTransferDto,
  TransferResult,
  TransactionQuery,
  PaginationMeta,
} from '../types';
import { accountKeys } from './useAccounts';

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (query?: TransactionQuery) => [...transactionKeys.lists(), query] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

/**
 * Hook to fetch all transactions with optional filtering and pagination
 * @param query - Query parameters for filtering, sorting, and pagination
 */
export const useTransactions = (
  query?: TransactionQuery
): UseQueryResult<{ transactions: Transaction[]; pagination: PaginationMeta }, Error> => {
  return useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => getAllTransactions(query),
  });
};

/**
 * Hook to fetch a single transaction by ID
 * @param id - Transaction UUID
 */
export const useTransaction = (id: string | undefined): UseQueryResult<Transaction, Error> => {
  return useQuery({
    queryKey: transactionKeys.detail(id!),
    queryFn: () => getTransactionById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to create a transaction
 * Invalidates transaction list and related account queries on success
 */
export const useCreateTransaction = (): UseMutationResult<Transaction, Error, CreateTransactionDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(transaction.accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.transactions(transaction.accountId, 1, 50) });
    },
  });
};

/**
 * Hook to create a transfer
 * Invalidates transaction list and related account queries for both accounts on success
 */
export const useCreateTransfer = (): UseMutationResult<TransferResult, Error, CreateTransferDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransfer,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(result.fromTransaction.accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(result.toTransaction.accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.transactions(result.fromTransaction.accountId, 1, 50) });
      queryClient.invalidateQueries({ queryKey: accountKeys.transactions(result.toTransaction.accountId, 1, 50) });
    },
  });
};

/**
 * Hook to update a transaction
 * Invalidates related queries on success
 */
export const useUpdateTransaction = (): UseMutationResult<
  Transaction,
  Error,
  { id: string; data: UpdateTransactionDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(transaction.id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(transaction.accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.transactions(transaction.accountId, 1, 50) });
    },
  });
};

/**
 * Hook to delete a transaction
 * Invalidates related queries on success
 */
export const useDeleteTransaction = (): UseMutationResult<
  void,
  Error,
  { id: string; accountId: string; transferAccountId?: string | null }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => deleteTransaction(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.removeQueries({ queryKey: transactionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.transactions(variables.accountId, 1, 50) });

      // If it was a transfer, also invalidate the destination account
      if (variables.transferAccountId) {
        queryClient.invalidateQueries({ queryKey: accountKeys.balance(variables.transferAccountId) });
        queryClient.invalidateQueries({ queryKey: accountKeys.transactions(variables.transferAccountId, 1, 50) });
      }
    },
  });
};

/**
 * Hook to parse CSV file
 * Returns headers and rows from CSV file
 */
export const useParseCSV = (): UseMutationResult<
  { headers: string[]; rows: string[][]; rowCount: number },
  Error,
  File
> => {
  return useMutation({
    mutationFn: parseCSV,
  });
};

/**
 * Hook to bulk import transactions
 * Invalidates transaction list and account queries on success
 */
export const useBulkImport = (): UseMutationResult<
  {
    imported: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  },
  Error,
  {
    accountId: string;
    transactions: Array<{
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      date: string;
      description: string;
      notes?: string;
      status?: 'PENDING' | 'CLEARED' | 'RECONCILED';
    }>;
    skipDuplicates: boolean;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, transactions, skipDuplicates }) =>
      bulkImport(accountId, transactions, skipDuplicates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.transactions(variables.accountId, 1, 50) });
    },
  });
};
