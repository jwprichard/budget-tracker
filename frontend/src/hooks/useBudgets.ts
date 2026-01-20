/**
 * React Query hooks for budget management
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getBudgets,
  getBudgetById,
  getBudgetSummary,
  getBudgetHistorical,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../services/budget.service';
import {
  Budget,
  BudgetWithStatus,
  BudgetSummaryResponse,
  BudgetHistoricalResponse,
  BudgetHistoricalQuery,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetQuery,
} from '../types/budget.types';

// Query keys for cache management
export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (query?: BudgetQuery) => [...budgetKeys.lists(), query] as const,
  summary: () => [...budgetKeys.all, 'summary'] as const,
  historical: (query: BudgetHistoricalQuery) => [...budgetKeys.all, 'historical', query] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
};

/**
 * Hook to fetch all budgets for the authenticated user
 * @param query - Optional query parameters (categoryId, periodType, periodYear, periodNumber, includeStatus)
 */
export const useBudgets = (query?: BudgetQuery): UseQueryResult<BudgetWithStatus[], Error> => {
  return useQuery({
    queryKey: budgetKeys.list(query),
    queryFn: () => getBudgets(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single budget by ID
 * @param id - Budget UUID
 */
export const useBudget = (id: string | undefined): UseQueryResult<BudgetWithStatus, Error> => {
  return useQuery({
    queryKey: budgetKeys.detail(id!),
    queryFn: () => getBudgetById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch budget summary for current period
 */
export const useBudgetSummary = (): UseQueryResult<BudgetSummaryResponse, Error> => {
  return useQuery({
    queryKey: budgetKeys.summary(),
    queryFn: getBudgetSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch budget historical comparison data
 * @param query - Comparison type and period type
 */
export const useBudgetHistorical = (query: BudgetHistoricalQuery): UseQueryResult<BudgetHistoricalResponse, Error> => {
  return useQuery({
    queryKey: budgetKeys.historical(query),
    queryFn: () => getBudgetHistorical(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a budget
 * Invalidates budget list and summary queries on success
 */
export const useCreateBudget = (): UseMutationResult<Budget, Error, CreateBudgetDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to update a budget
 * Invalidates related queries on success
 */
export const useUpdateBudget = (): UseMutationResult<
  Budget,
  Error,
  { id: string; data: UpdateBudgetDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateBudget(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to delete a budget
 * Invalidates all budget queries on success
 */
export const useDeleteBudget = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
};
