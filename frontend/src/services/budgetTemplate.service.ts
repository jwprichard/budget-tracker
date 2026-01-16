/**
 * Budget Template Service
 * API client methods for budget template management
 */

import apiClient from './api';
import {
  BudgetTemplate,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
  UpdateBudgetInstanceDto,
  Budget,
} from '../types/budget.types';
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/budget-templates';

/**
 * Get all budget templates for the authenticated user
 */
export const getTemplates = async (): Promise<BudgetTemplate[]> => {
  const response = await apiClient.get<SuccessResponse<BudgetTemplate[]>>(BASE_PATH);
  return response.data.data;
};

/**
 * Get a single budget template by ID
 * @param id - Template UUID
 */
export const getTemplateById = async (id: string): Promise<BudgetTemplate> => {
  const response = await apiClient.get<SuccessResponse<BudgetTemplate>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Create a new budget template
 * Creates template + generates next 12 periods of budgets
 * @param data - Template creation data
 */
export const createTemplate = async (data: CreateBudgetTemplateDto): Promise<BudgetTemplate> => {
  const response = await apiClient.post<SuccessResponse<BudgetTemplate>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Update a budget template
 * @param id - Template UUID
 * @param data - Template update data
 * @param updateInstances - Whether to update linked budget instances (default: true)
 */
export const updateTemplate = async (
  id: string,
  data: UpdateBudgetTemplateDto,
  updateInstances: boolean = true
): Promise<BudgetTemplate> => {
  const response = await apiClient.put<SuccessResponse<BudgetTemplate>>(
    `${BASE_PATH}/${id}`,
    data,
    {
      params: { updateInstances },
    }
  );
  return response.data.data;
};

/**
 * Delete a budget template
 * Deletes template and future budget instances, preserves past/current
 * @param id - Template UUID
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/${id}`);
};

/**
 * Get all budget instances for a template
 * @param templateId - Template UUID
 */
export const getTemplateBudgets = async (templateId: string): Promise<Budget[]> => {
  const response = await apiClient.get<SuccessResponse<Budget[]>>(
    `${BASE_PATH}/${templateId}/budgets`
  );
  return response.data.data;
};

/**
 * Generate additional budget instances for a template
 * @param templateId - Template UUID
 * @param count - Number of periods to generate (default: 12)
 */
export const generateBudgets = async (
  templateId: string,
  count: number = 12
): Promise<Budget[]> => {
  const response = await apiClient.post<SuccessResponse<Budget[]>>(
    `${BASE_PATH}/${templateId}/generate`,
    { count }
  );
  return response.data.data;
};

/**
 * Update a budget instance with scope
 * @param budgetId - Budget UUID
 * @param data - Budget update data with scope
 */
export const updateBudgetInstance = async (
  budgetId: string,
  data: UpdateBudgetInstanceDto
): Promise<Budget> => {
  const response = await apiClient.put<SuccessResponse<Budget>>(
    `${BASE_PATH}/budgets/${budgetId}`,
    data
  );
  return response.data.data;
};

export const budgetTemplateService = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateBudgets,
  generateBudgets,
  updateBudgetInstance,
};

export default budgetTemplateService;
