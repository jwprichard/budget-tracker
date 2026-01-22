/**
 * React Query hooks for budget template management
 *
 * With virtual periods architecture:
 * - Templates define patterns (no instances pre-generated)
 * - Periods are calculated on-the-fly
 * - Overrides are created only when user customizes a period
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateOverrides,
  createPeriodOverride,
  updateOverride,
  deleteOverride,
} from '../services/budgetTemplate.service';
import {
  BudgetTemplate,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
  CreateOverrideDto,
  UpdateOverrideDto,
  Budget,
} from '../types/budget.types';
import { budgetKeys } from './useBudgets';

// Query keys for cache management
export const templateKeys = {
  all: ['budgetTemplates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  overrides: (id: string) => [...templateKeys.detail(id), 'overrides'] as const,
};

/**
 * Hook to fetch all budget templates for the authenticated user
 */
export const useBudgetTemplates = (): UseQueryResult<BudgetTemplate[], Error> => {
  return useQuery({
    queryKey: templateKeys.lists(),
    queryFn: getTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single budget template by ID
 * @param id - Template UUID
 */
export const useBudgetTemplate = (
  id: string | undefined
): UseQueryResult<BudgetTemplate, Error> => {
  return useQuery({
    queryKey: templateKeys.detail(id!),
    queryFn: () => getTemplateById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch override budgets for a template
 * @param templateId - Template UUID
 */
export const useTemplateOverrides = (
  templateId: string | undefined
): UseQueryResult<Budget[], Error> => {
  return useQuery({
    queryKey: templateKeys.overrides(templateId!),
    queryFn: () => getTemplateOverrides(templateId!),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a budget template
 * Invalidates template and budget list queries on success
 */
export const useCreateTemplate = (): UseMutationResult<
  BudgetTemplate,
  Error,
  CreateBudgetTemplateDto
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to update a budget template
 * Changes apply to all future virtual periods automatically
 * Existing overrides are not affected
 */
export const useUpdateTemplate = (): UseMutationResult<
  BudgetTemplate,
  Error,
  { id: string; data: UpdateBudgetTemplateDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to delete a budget template
 * Deletes template and all its override budgets
 */
export const useDeleteTemplate = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
};

/**
 * Hook to create an override for a specific period
 * Used when customizing a virtual period
 */
export const useCreatePeriodOverride = (): UseMutationResult<
  Budget,
  Error,
  { templateId: string; data: CreateOverrideDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, data }) => createPeriodOverride(templateId, data),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.overrides(templateId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.ranges() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to update an existing override
 */
export const useUpdateOverride = (): UseMutationResult<
  Budget,
  Error,
  { budgetId: string; data: UpdateOverrideDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, data }) => updateOverride(budgetId, data),
    onSuccess: (updatedBudget) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(updatedBudget.id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });

      // Invalidate template overrides if it has a templateId
      if (updatedBudget.templateId) {
        queryClient.invalidateQueries({
          queryKey: templateKeys.overrides(updatedBudget.templateId),
        });
      }
    },
  });
};

/**
 * Hook to delete an override (returns period to virtual status)
 */
export const useDeleteOverride = (): UseMutationResult<
  void,
  Error,
  { budgetId: string; templateId?: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId }) => deleteOverride(budgetId),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });

      // Invalidate template overrides if templateId was provided
      if (templateId) {
        queryClient.invalidateQueries({
          queryKey: templateKeys.overrides(templateId),
        });
      }
    },
  });
};
