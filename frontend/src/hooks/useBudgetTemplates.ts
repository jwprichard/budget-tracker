/**
 * React Query hooks for budget template management
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
  getTemplateBudgets,
  generateBudgets,
  updateBudgetInstance,
} from '../services/budgetTemplate.service';
import {
  BudgetTemplate,
  CreateBudgetTemplateDto,
  UpdateBudgetTemplateDto,
  UpdateBudgetInstanceDto,
  Budget,
} from '../types/budget.types';
import { budgetKeys } from './useBudgets';

// Query keys for cache management
export const templateKeys = {
  all: ['budgetTemplates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  budgets: (id: string) => [...templateKeys.detail(id), 'budgets'] as const,
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
 * Hook to fetch budget instances for a template
 * @param templateId - Template UUID
 */
export const useTemplateBudgets = (
  templateId: string | undefined
): UseQueryResult<Budget[], Error> => {
  return useQuery({
    queryKey: templateKeys.budgets(templateId!),
    queryFn: () => getTemplateBudgets(templateId!),
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
 * Invalidates related queries on success
 */
export const useUpdateTemplate = (): UseMutationResult<
  BudgetTemplate,
  Error,
  { id: string; data: UpdateBudgetTemplateDto; updateInstances?: boolean }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, updateInstances }) => updateTemplate(id, data, updateInstances),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.budgets(id) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to delete a budget template
 * Invalidates all template and budget queries on success
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
 * Hook to generate additional budget instances for a template
 * Invalidates template budgets and budget list queries on success
 */
export const useGenerateBudgets = (): UseMutationResult<
  Budget[],
  Error,
  { templateId: string; count?: number }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, count }) => generateBudgets(templateId, count),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.budgets(templateId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
};

/**
 * Hook to update a budget instance with scope
 * Invalidates related queries on success based on scope
 */
export const useUpdateBudgetInstance = (): UseMutationResult<
  Budget,
  Error,
  { budgetId: string; data: UpdateBudgetInstanceDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, data }) => updateBudgetInstance(budgetId, data),
    onSuccess: (updatedBudget, { data }) => {
      // Invalidate the specific budget
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(updatedBudget.id) });

      // If scope affects multiple budgets, invalidate all lists
      if (data.scope === 'THIS_AND_FUTURE' || data.scope === 'ALL') {
        queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
        queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });

        // Invalidate template if it was updated
        if (updatedBudget.templateId) {
          queryClient.invalidateQueries({
            queryKey: templateKeys.detail(updatedBudget.templateId),
          });
          queryClient.invalidateQueries({
            queryKey: templateKeys.budgets(updatedBudget.templateId),
          });
        }
      } else {
        // For THIS_ONLY, only invalidate specific budget and lists
        queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
        queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
      }
    },
  });
};
