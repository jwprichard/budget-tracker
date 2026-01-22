/**
 * React Query hooks for planned transactions
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
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
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplateOccurrences,
  createPlannedTransaction,
  getPlannedTransactions,
  getPlannedTransactionById,
  updatePlannedTransaction,
  deletePlannedTransaction,
} from '../services/plannedTransaction.service';

// ============================================================================
// Query Keys
// ============================================================================

export const plannedTransactionKeys = {
  all: ['planned-transactions'] as const,
  templates: () => [...plannedTransactionKeys.all, 'templates'] as const,
  templateList: (query?: PlannedTransactionTemplateQuery) =>
    [...plannedTransactionKeys.templates(), 'list', query] as const,
  templateDetail: (id: string) => [...plannedTransactionKeys.templates(), 'detail', id] as const,
  templateOccurrences: (id: string, query: TemplateOccurrencesQuery) =>
    [...plannedTransactionKeys.templates(), 'occurrences', id, query] as const,
  transactions: () => [...plannedTransactionKeys.all, 'transactions'] as const,
  transactionList: (query?: PlannedTransactionQuery) =>
    [...plannedTransactionKeys.transactions(), 'list', query] as const,
  transactionDetail: (id: string) => [...plannedTransactionKeys.transactions(), 'detail', id] as const,
};

// ============================================================================
// Template Hooks
// ============================================================================

/**
 * Fetch all planned transaction templates
 */
export const usePlannedTransactionTemplates = (
  query?: PlannedTransactionTemplateQuery
): UseQueryResult<PlannedTransactionTemplate[], Error> => {
  return useQuery({
    queryKey: plannedTransactionKeys.templateList(query),
    queryFn: () => getTemplates(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single template by ID
 */
export const usePlannedTransactionTemplate = (
  id: string
): UseQueryResult<PlannedTransactionTemplate, Error> => {
  return useQuery({
    queryKey: plannedTransactionKeys.templateDetail(id),
    queryFn: () => getTemplateById(id),
    enabled: !!id,
  });
};

/**
 * Fetch template occurrences in a date range
 */
export const useTemplateOccurrences = (
  templateId: string,
  query: TemplateOccurrencesQuery
): UseQueryResult<PlannedTransaction[], Error> => {
  return useQuery({
    queryKey: plannedTransactionKeys.templateOccurrences(templateId, query),
    queryFn: () => getTemplateOccurrences(templateId, query),
    enabled: !!templateId && !!query.startDate && !!query.endDate,
  });
};

/**
 * Create a new template
 */
export const useCreatePlannedTransactionTemplate = (): UseMutationResult<
  PlannedTransactionTemplate,
  Error,
  CreatePlannedTransactionTemplateDto
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templates() });
    },
  });
};

/**
 * Update a template
 */
export const useUpdatePlannedTransactionTemplate = (): UseMutationResult<
  PlannedTransactionTemplate,
  Error,
  { id: string; data: UpdatePlannedTransactionTemplateDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templates() });
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templateDetail(id) });
    },
  });
};

/**
 * Delete a template
 */
export const useDeletePlannedTransactionTemplate = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templates() });
    },
  });
};

// ============================================================================
// Planned Transaction Hooks
// ============================================================================

/**
 * Fetch planned transactions with optional filters
 */
export const usePlannedTransactions = (
  query?: PlannedTransactionQuery
): UseQueryResult<PlannedTransaction[], Error> => {
  return useQuery({
    queryKey: plannedTransactionKeys.transactionList(query),
    queryFn: () => getPlannedTransactions(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single planned transaction by ID
 */
export const usePlannedTransaction = (
  id: string
): UseQueryResult<PlannedTransaction, Error> => {
  return useQuery({
    queryKey: plannedTransactionKeys.transactionDetail(id),
    queryFn: () => getPlannedTransactionById(id),
    enabled: !!id,
  });
};

/**
 * Create a new planned transaction
 */
export const useCreatePlannedTransaction = (): UseMutationResult<
  PlannedTransaction,
  Error,
  CreatePlannedTransactionDto
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlannedTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templates() });
    },
  });
};

/**
 * Update a planned transaction
 */
export const useUpdatePlannedTransaction = (): UseMutationResult<
  PlannedTransaction,
  Error,
  { id: string; data: UpdatePlannedTransactionDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updatePlannedTransaction(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.transactionDetail(id) });
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templates() });
    },
  });
};

/**
 * Delete a planned transaction
 */
export const useDeletePlannedTransaction = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlannedTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: plannedTransactionKeys.templates() });
    },
  });
};
