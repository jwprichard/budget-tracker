import { useQuery, UseQueryResult } from '@tanstack/react-query';
import analyticsService from '../services/analytics.service';
import {
  DailyBalancesResponse,
  DailyBalancesParams,
  CategoryTotalsResponse,
  CategoryTotalsParams,
  SpendingTrendsResponse,
  SpendingTrendsParams,
  IncomeVsExpenseParams,
} from '../types/analytics.types';

/**
 * Analytics React Query Hooks
 * Provides data fetching with caching, refetching, and error handling
 */

/**
 * Hook to fetch daily balances for calendar view
 * @param params Date range and optional account filters
 * @param enabled Whether to enable the query (default: true)
 */
export const useDailyBalances = (
  params: DailyBalancesParams,
  enabled: boolean = true
): UseQueryResult<DailyBalancesResponse, Error> => {
  return useQuery({
    queryKey: ['analytics', 'daily-balances', params],
    queryFn: () => analyticsService.getDailyBalances(params),
    enabled: enabled && !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
};

/**
 * Hook to fetch category totals for pie/donut charts
 * @param params Date range, type filter, and optional account/subcategory filters
 * @param enabled Whether to enable the query (default: true)
 */
export const useCategoryTotals = (
  params: CategoryTotalsParams,
  enabled: boolean = true
): UseQueryResult<CategoryTotalsResponse, Error> => {
  return useQuery({
    queryKey: ['analytics', 'category-totals', params],
    queryFn: () => analyticsService.getCategoryTotals(params),
    enabled: enabled && !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch spending trends for line/bar charts
 * @param params Date range, grouping period, and optional filters
 * @param enabled Whether to enable the query (default: true)
 */
export const useSpendingTrends = (
  params: SpendingTrendsParams,
  enabled: boolean = true
): UseQueryResult<SpendingTrendsResponse, Error> => {
  return useQuery({
    queryKey: ['analytics', 'spending-trends', params],
    queryFn: () => analyticsService.getSpendingTrends(params),
    enabled: enabled && !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch income vs expense comparison
 * @param params Date range, grouping period, and optional filters
 * @param enabled Whether to enable the query (default: true)
 */
export const useIncomeVsExpense = (
  params: IncomeVsExpenseParams,
  enabled: boolean = true
): UseQueryResult<SpendingTrendsResponse, Error> => {
  return useQuery({
    queryKey: ['analytics', 'income-vs-expense', params],
    queryFn: () => analyticsService.getIncomeVsExpense(params),
    enabled: enabled && !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
