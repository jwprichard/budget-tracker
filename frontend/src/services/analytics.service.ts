import apiClient from './api';
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
 * Analytics API Service
 * Handles all analytics-related API calls
 */

class AnalyticsService {
  private readonly baseUrl = '/v1/analytics';

  /**
   * Convert array parameters to comma-separated string for query params
   */
  private arrayToQueryString(arr?: string[]): string | undefined {
    return arr && arr.length > 0 ? arr.join(',') : undefined;
  }

  /**
   * Get daily balances for accounts over a date range
   * GET /api/v1/analytics/daily-balances
   */
  async getDailyBalances(params: DailyBalancesParams): Promise<DailyBalancesResponse> {
    const response = await apiClient.get<{ success: boolean; data: DailyBalancesResponse }>(
      `${this.baseUrl}/daily-balances`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          accountIds: this.arrayToQueryString(params.accountIds),
        },
      }
    );
    return response.data.data;
  }

  /**
   * Get category totals for spending/income aggregation
   * GET /api/v1/analytics/category-totals
   */
  async getCategoryTotals(params: CategoryTotalsParams): Promise<CategoryTotalsResponse> {
    const response = await apiClient.get<{ success: boolean; data: CategoryTotalsResponse }>(
      `${this.baseUrl}/category-totals`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          accountIds: this.arrayToQueryString(params.accountIds),
          type: params.type || 'EXPENSE',
          includeSubcategories: params.includeSubcategories !== false ? 'true' : 'false',
        },
      }
    );
    return response.data.data;
  }

  /**
   * Get spending trends over time with period grouping
   * GET /api/v1/analytics/spending-trends
   */
  async getSpendingTrends(params: SpendingTrendsParams): Promise<SpendingTrendsResponse> {
    const response = await apiClient.get<{ success: boolean; data: SpendingTrendsResponse }>(
      `${this.baseUrl}/spending-trends`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          accountIds: this.arrayToQueryString(params.accountIds),
          categoryIds: this.arrayToQueryString(params.categoryIds),
          groupBy: params.groupBy || 'day',
        },
      }
    );
    return response.data.data;
  }

  /**
   * Get income vs expense comparison over time
   * GET /api/v1/analytics/income-vs-expense
   */
  async getIncomeVsExpense(params: IncomeVsExpenseParams): Promise<SpendingTrendsResponse> {
    const response = await apiClient.get<{ success: boolean; data: SpendingTrendsResponse }>(
      `${this.baseUrl}/income-vs-expense`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          accountIds: this.arrayToQueryString(params.accountIds),
          categoryIds: this.arrayToQueryString(params.categoryIds),
          groupBy: params.groupBy || 'day',
        },
      }
    );
    return response.data.data;
  }
}

export default new AnalyticsService();
