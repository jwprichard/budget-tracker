/**
 * React Query hooks for forecast
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  ForecastResponse,
  ForecastSummaryResponse,
  LowBalanceWarning,
  ForecastQuery,
  LowBalanceWarningQuery,
} from '../types/forecast.types';
import {
  getForecast,
  getForecastSummary,
  getLowBalanceWarnings,
} from '../services/forecast.service';

// ============================================================================
// Query Keys
// ============================================================================

export const forecastKeys = {
  all: ['forecast'] as const,
  detail: (query?: ForecastQuery) => [...forecastKeys.all, 'detail', query] as const,
  summary: (days?: number) => [...forecastKeys.all, 'summary', days] as const,
  warnings: (query?: LowBalanceWarningQuery) => [...forecastKeys.all, 'warnings', query] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch full forecast with daily breakdowns
 */
export const useForecast = (
  query?: ForecastQuery,
  enabled: boolean = true
): UseQueryResult<ForecastResponse, Error> => {
  return useQuery({
    queryKey: forecastKeys.detail(query),
    queryFn: () => getForecast(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
};

/**
 * Fetch forecast summary (faster, less data)
 */
export const useForecastSummary = (
  days: number = 90
): UseQueryResult<ForecastSummaryResponse, Error> => {
  return useQuery({
    queryKey: forecastKeys.summary(days),
    queryFn: () => getForecastSummary(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch low balance warnings
 */
export const useLowBalanceWarnings = (
  query?: LowBalanceWarningQuery
): UseQueryResult<LowBalanceWarning[], Error> => {
  return useQuery({
    queryKey: forecastKeys.warnings(query),
    queryFn: () => getLowBalanceWarnings(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
