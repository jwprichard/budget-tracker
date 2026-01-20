/**
 * Budget Service
 * API client methods for budget management
 */

import apiClient from './api';
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
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/budgets';

/**
 * Get all budgets for the authenticated user
 * @param query - Optional query parameters (categoryId, periodType, periodYear, periodNumber, includeStatus)
 */
export const getBudgets = async (query?: BudgetQuery): Promise<BudgetWithStatus[]> => {
  const response = await apiClient.get<SuccessResponse<BudgetWithStatus[]>>(BASE_PATH, {
    params: query,
  });
  return response.data.data;
};

/**
 * Get budget by ID
 * @param id - Budget UUID
 */
export const getBudgetById = async (id: string): Promise<BudgetWithStatus> => {
  const response = await apiClient.get<SuccessResponse<BudgetWithStatus>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Get budget summary for current period
 */
export const getBudgetSummary = async (): Promise<BudgetSummaryResponse> => {
  const response = await apiClient.get<SuccessResponse<BudgetSummaryResponse>>(`${BASE_PATH}/summary`);
  return response.data.data;
};

/**
 * Get historical comparison data for budgets
 * @param query - Comparison type and period type
 */
export const getBudgetHistorical = async (query: BudgetHistoricalQuery): Promise<BudgetHistoricalResponse> => {
  const response = await apiClient.get<SuccessResponse<BudgetHistoricalResponse>>(`${BASE_PATH}/historical`, {
    params: query,
  });
  return response.data.data;
};

/**
 * Create a new budget
 * @param data - Budget creation data
 */
export const createBudget = async (data: CreateBudgetDto): Promise<Budget> => {
  const response = await apiClient.post<SuccessResponse<Budget>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Update a budget
 * @param id - Budget UUID
 * @param data - Budget update data
 */
export const updateBudget = async (id: string, data: UpdateBudgetDto): Promise<Budget> => {
  const response = await apiClient.put<SuccessResponse<Budget>>(`${BASE_PATH}/${id}`, data);
  return response.data.data;
};

/**
 * Delete a budget
 * @param id - Budget UUID
 */
export const deleteBudget = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/${id}`);
};

export const budgetService = {
  getBudgets,
  getBudgetById,
  getBudgetSummary,
  getBudgetHistorical,
  createBudget,
  updateBudget,
  deleteBudget,
};

export default budgetService;
