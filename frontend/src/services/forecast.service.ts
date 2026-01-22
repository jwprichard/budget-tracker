/**
 * Forecast Service
 * API client methods for cash flow forecasting
 */

import apiClient from './api';
import {
  ForecastResponse,
  ForecastSummaryResponse,
  LowBalanceWarning,
  ForecastQuery,
  LowBalanceWarningQuery,
} from '../types/forecast.types';
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/forecast';

/**
 * Get full forecast with daily breakdowns
 * @param query - Optional query parameters (startDate, endDate, days, accountIds)
 */
export const getForecast = async (query?: ForecastQuery): Promise<ForecastResponse> => {
  const response = await apiClient.get<SuccessResponse<ForecastResponse>>(BASE_PATH, {
    params: query,
  });
  return response.data.data;
};

/**
 * Get forecast summary (faster, less data)
 * @param days - Number of days to forecast (default: 90)
 */
export const getForecastSummary = async (days?: number): Promise<ForecastSummaryResponse> => {
  const response = await apiClient.get<SuccessResponse<ForecastSummaryResponse>>(
    `${BASE_PATH}/summary`,
    { params: { days } }
  );
  return response.data.data;
};

/**
 * Get low balance warnings
 * @param query - Query parameters (threshold, days)
 */
export const getLowBalanceWarnings = async (
  query?: LowBalanceWarningQuery
): Promise<LowBalanceWarning[]> => {
  const response = await apiClient.get<SuccessResponse<LowBalanceWarning[]>>(
    `${BASE_PATH}/low-balance-warnings`,
    { params: query }
  );
  return response.data.data;
};

export const forecastService = {
  getForecast,
  getForecastSummary,
  getLowBalanceWarnings,
};

export default forecastService;
