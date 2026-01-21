/**
 * Budget Template Service
 * API client methods for budget template management
 *
 * With virtual periods architecture:
 * - Templates define patterns (no instances pre-generated)
 * - Periods are calculated on-the-fly
 * - Overrides are created only when user customizes a period
 */

import apiClient from './api';
import {
  BudgetTemplate,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
  Budget,
  CreateOverrideDto,
  UpdateOverrideDto,
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
 * Only creates the template - no budget instances generated
 * @param data - Template creation data
 */
export const createTemplate = async (data: CreateBudgetTemplateDto): Promise<BudgetTemplate> => {
  const response = await apiClient.post<SuccessResponse<BudgetTemplate>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Update a budget template
 * Changes apply to all future virtual periods automatically
 * Existing overrides are not affected
 * @param id - Template UUID
 * @param data - Template update data
 */
export const updateTemplate = async (
  id: string,
  data: UpdateBudgetTemplateDto
): Promise<BudgetTemplate> => {
  const response = await apiClient.put<SuccessResponse<BudgetTemplate>>(
    `${BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
};

/**
 * Delete a budget template
 * Deletes template and all its override budgets
 * @param id - Template UUID
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/${id}`);
};

/**
 * Get all overrides for a template
 * @param templateId - Template UUID
 */
export const getTemplateOverrides = async (templateId: string): Promise<Budget[]> => {
  const response = await apiClient.get<SuccessResponse<Budget[]>>(
    `${BASE_PATH}/${templateId}/overrides`
  );
  return response.data.data;
};

/**
 * Create an override for a specific period
 * Used when customizing a virtual period
 * @param templateId - Template UUID
 * @param data - Override creation data
 */
export const createPeriodOverride = async (
  templateId: string,
  data: CreateOverrideDto
): Promise<Budget> => {
  const response = await apiClient.post<SuccessResponse<Budget>>(
    `${BASE_PATH}/${templateId}/overrides`,
    data
  );
  return response.data.data;
};

/**
 * Update an existing override
 * @param budgetId - Budget UUID (must be an override)
 * @param data - Override update data
 */
export const updateOverride = async (
  budgetId: string,
  data: UpdateOverrideDto
): Promise<Budget> => {
  const response = await apiClient.put<SuccessResponse<Budget>>(
    `${BASE_PATH}/overrides/${budgetId}`,
    data
  );
  return response.data.data;
};

/**
 * Delete an override (returns period to virtual status)
 * @param budgetId - Budget UUID (must be an override)
 */
export const deleteOverride = async (budgetId: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/overrides/${budgetId}`);
};

export const budgetTemplateService = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateOverrides,
  createPeriodOverride,
  updateOverride,
  deleteOverride,
};

export default budgetTemplateService;
