import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryHierarchy,
  getCategoryStats,
} from '../services/category.service';
import { Category, CreateCategoryDto, UpdateCategoryDto, CategoryQuery } from '../types';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (query?: CategoryQuery) => [...categoryKeys.lists(), query] as const,
  hierarchy: () => [...categoryKeys.all, 'hierarchy'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string, includeChildren = false) => [...categoryKeys.details(), id, { includeChildren }] as const,
  stats: (id: string, includeChildren = false) => [...categoryKeys.detail(id, includeChildren), 'stats'] as const,
};

/**
 * Hook to fetch all categories
 * @param query - Optional query parameters (parentId, includeChildren, includeRoot)
 */
export const useCategories = (query?: CategoryQuery): UseQueryResult<Category[], Error> => {
  return useQuery({
    queryKey: categoryKeys.list(query),
    queryFn: () => getAllCategories(query),
  });
};

/**
 * Hook to fetch a single category by ID
 * @param id - Category UUID
 * @param includeChildren - Whether to include child categories
 */
export const useCategory = (
  id: string | undefined,
  includeChildren = false
): UseQueryResult<Category, Error> => {
  return useQuery({
    queryKey: categoryKeys.detail(id!, includeChildren),
    queryFn: () => getCategoryById(id!, includeChildren),
    enabled: !!id,
  });
};

/**
 * Hook to fetch full category hierarchy
 * Returns root categories with nested children as a tree structure
 */
export const useCategoryHierarchy = (): UseQueryResult<Category[], Error> => {
  return useQuery({
    queryKey: categoryKeys.hierarchy(),
    queryFn: getCategoryHierarchy,
  });
};

/**
 * Hook to fetch category with transaction count
 * @param id - Category UUID
 * @param includeChildren - Whether to count transactions in child categories
 */
export const useCategoryStats = (
  id: string | undefined,
  includeChildren = false
): UseQueryResult<Category, Error> => {
  return useQuery({
    queryKey: categoryKeys.stats(id!, includeChildren),
    queryFn: () => getCategoryStats(id!, includeChildren),
    enabled: !!id,
  });
};

/**
 * Hook to create a category
 * Invalidates category list and hierarchy queries on success
 */
export const useCreateCategory = (): UseMutationResult<Category, Error, CreateCategoryDto> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.hierarchy() });
    },
  });
};

/**
 * Hook to update a category
 * Invalidates related queries on success
 */
export const useUpdateCategory = (): UseMutationResult<
  Category,
  Error,
  { id: string; data: UpdateCategoryDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.hierarchy() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.details() });
      // Also invalidate parent category if this is a child
      if (updatedCategory.parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.detail(updatedCategory.parentId, true) });
      }
    },
  });
};

/**
 * Hook to delete a category
 * Invalidates related queries on success
 */
export const useDeleteCategory = (): UseMutationResult<Category, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (deletedCategory) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.hierarchy() });
      queryClient.removeQueries({ queryKey: categoryKeys.details() });
      // Also invalidate parent category if this was a child
      if (deletedCategory.parentId) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.detail(deletedCategory.parentId, true) });
      }
    },
  });
};
