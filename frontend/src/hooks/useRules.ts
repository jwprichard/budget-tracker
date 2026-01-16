import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ruleService, CreateRuleDto, UpdateRuleDto, CategoryRule } from '../services/rule.service';

/**
 * React Query hook to fetch all rules
 */
export function useRules(includeDisabled = false) {
  return useQuery({
    queryKey: ['rules', includeDisabled],
    queryFn: () => ruleService.getRules(includeDisabled),
  });
}

/**
 * React Query hook to fetch a single rule by ID
 */
export function useRuleById(id: string) {
  return useQuery({
    queryKey: ['rules', id],
    queryFn: () => ruleService.getRuleById(id),
    enabled: !!id,
  });
}

/**
 * React Query hook to create a new rule
 */
export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRuleDto) => ruleService.createRule(data),
    onSuccess: () => {
      // Invalidate rules queries to refetch
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      // Also invalidate transactions to show new categorizations
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * React Query hook to update an existing rule
 */
export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRuleDto }) =>
      ruleService.updateRule(id, data),
    onSuccess: () => {
      // Invalidate rules queries to refetch
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      // Also invalidate transactions to show new categorizations
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * React Query hook to delete a rule
 */
export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ruleService.deleteRule(id),
    onSuccess: () => {
      // Invalidate rules queries to refetch
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      // Also invalidate transactions (categorization may change)
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
