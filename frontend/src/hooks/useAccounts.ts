import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountBalance,
  getAccountTransactions,
} from '../services/account.service';
import {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountBalance,
  Transaction,
  PaginationMeta,
} from '../types';

// Query keys
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...accountKeys.lists(), { includeInactive }] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  balance: (id: string) => [...accountKeys.detail(id), 'balance'] as const,
  transactions: (id: string, page: number, pageSize: number) =>
    [...accountKeys.detail(id), 'transactions', { page, pageSize }] as const,
};

/**
 * Hook to fetch all accounts
 * @param includeInactive - Whether to include inactive accounts
 */
export const useAccounts = (includeInactive = false): UseQueryResult<Account[], Error> => {
  return useQuery({
    queryKey: accountKeys.list(includeInactive),
    queryFn: () => getAllAccounts(includeInactive),
  });
};

/**
 * Hook to fetch a single account by ID
 * @param id - Account UUID
 */
export const useAccount = (id: string | undefined): UseQueryResult<Account, Error> => {
  return useQuery({
    queryKey: accountKeys.detail(id!),
    queryFn: () => getAccountById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to fetch account balance
 * @param id - Account UUID
 */
export const useAccountBalance = (id: string | undefined): UseQueryResult<AccountBalance, Error> => {
  return useQuery({
    queryKey: accountKeys.balance(id!),
    queryFn: () => getAccountBalance(id!),
    enabled: !!id,
  });
};

/**
 * Hook to fetch account transactions
 * @param id - Account UUID
 * @param page - Page number
 * @param pageSize - Items per page
 */
export const useAccountTransactions = (
  id: string | undefined,
  page = 1,
  pageSize = 50
): UseQueryResult<{ transactions: Transaction[]; pagination: PaginationMeta }, Error> => {
  return useQuery({
    queryKey: accountKeys.transactions(id!, page, pageSize),
    queryFn: () => getAccountTransactions(id!, page, pageSize),
    enabled: !!id,
  });
};

/**
 * Hook to create an account
 * Invalidates account list queries on success
 */
export const useCreateAccount = (): UseMutationResult<Account, Error, CreateAccountDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
};

/**
 * Hook to update an account
 * Invalidates related queries on success
 */
export const useUpdateAccount = (): UseMutationResult<Account, Error, { id: string; data: UpdateAccountDto }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: (updatedAccount) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(updatedAccount.id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.balance(updatedAccount.id) });
    },
  });
};

/**
 * Hook to delete an account
 * Invalidates related queries on success
 */
export const useDeleteAccount = (): UseMutationResult<Account, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: (deletedAccount) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      queryClient.removeQueries({ queryKey: accountKeys.detail(deletedAccount.id) });
      queryClient.removeQueries({ queryKey: accountKeys.balance(deletedAccount.id) });
    },
  });
};
