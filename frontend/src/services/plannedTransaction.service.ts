/**
 * Planned Transaction Service
 * API client methods for planned transaction management
 */

import apiClient from './api';
import {
  PlannedTransactionTemplate,
  PlannedTransaction,
  CreatePlannedTransactionTemplateDto,
  UpdatePlannedTransactionTemplateDto,
  CreatePlannedTransactionDto,
  UpdatePlannedTransactionDto,
  PlannedTransactionTemplateQuery,
  PlannedTransactionQuery,
  TemplateOccurrencesQuery,
} from '../types/plannedTransaction.types';
import { SuccessResponse } from '../types';

const BASE_PATH = '/v1/planned-transactions';

// ============================================================================
// Template Endpoints
// ============================================================================

/**
 * Create a new planned transaction template
 */
export const createTemplate = async (
  data: CreatePlannedTransactionTemplateDto
): Promise<PlannedTransactionTemplate> => {
  const response = await apiClient.post<SuccessResponse<PlannedTransactionTemplate>>(
    `${BASE_PATH}/templates`,
    data
  );
  return response.data.data;
};

/**
 * Get all planned transaction templates
 */
export const getTemplates = async (
  query?: PlannedTransactionTemplateQuery
): Promise<PlannedTransactionTemplate[]> => {
  const response = await apiClient.get<SuccessResponse<PlannedTransactionTemplate[]>>(
    `${BASE_PATH}/templates`,
    { params: query }
  );
  return response.data.data;
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (id: string): Promise<PlannedTransactionTemplate> => {
  const response = await apiClient.get<SuccessResponse<PlannedTransactionTemplate>>(
    `${BASE_PATH}/templates/${id}`
  );
  return response.data.data;
};

/**
 * Update a template
 */
export const updateTemplate = async (
  id: string,
  data: UpdatePlannedTransactionTemplateDto
): Promise<PlannedTransactionTemplate> => {
  const response = await apiClient.put<SuccessResponse<PlannedTransactionTemplate>>(
    `${BASE_PATH}/templates/${id}`,
    data
  );
  return response.data.data;
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/templates/${id}`);
};

/**
 * Get occurrences for a template within a date range
 */
export const getTemplateOccurrences = async (
  templateId: string,
  query: TemplateOccurrencesQuery
): Promise<PlannedTransaction[]> => {
  const response = await apiClient.get<SuccessResponse<PlannedTransaction[]>>(
    `${BASE_PATH}/templates/${templateId}/occurrences`,
    { params: query }
  );
  return response.data.data;
};

// ============================================================================
// Planned Transaction Endpoints (One-time & Overrides)
// ============================================================================

/**
 * Create a new planned transaction (one-time or override)
 */
export const createPlannedTransaction = async (
  data: CreatePlannedTransactionDto
): Promise<PlannedTransaction> => {
  const response = await apiClient.post<SuccessResponse<PlannedTransaction>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Get planned transactions with optional filters
 */
export const getPlannedTransactions = async (
  query?: PlannedTransactionQuery
): Promise<PlannedTransaction[]> => {
  const response = await apiClient.get<SuccessResponse<PlannedTransaction[]>>(BASE_PATH, {
    params: query,
  });
  return response.data.data;
};

/**
 * Get a single planned transaction by ID
 * Note: ID can be a real UUID or virtual ID
 */
export const getPlannedTransactionById = async (id: string): Promise<PlannedTransaction> => {
  const response = await apiClient.get<SuccessResponse<PlannedTransaction>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Update a planned transaction
 * Note: If ID is virtual, creates an override
 */
export const updatePlannedTransaction = async (
  id: string,
  data: UpdatePlannedTransactionDto
): Promise<PlannedTransaction> => {
  const response = await apiClient.put<SuccessResponse<PlannedTransaction>>(
    `${BASE_PATH}/${id}`,
    data
  );
  return response.data.data;
};

/**
 * Delete a planned transaction
 * Note: Virtual occurrences cannot be deleted
 */
export const deletePlannedTransaction = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_PATH}/${id}`);
};

// ============================================================================
// Service Object Export
// ============================================================================

export const plannedTransactionService = {
  // Templates
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplateOccurrences,
  // Planned Transactions
  createPlannedTransaction,
  getPlannedTransactions,
  getPlannedTransactionById,
  updatePlannedTransaction,
  deletePlannedTransaction,
};

export default plannedTransactionService;
