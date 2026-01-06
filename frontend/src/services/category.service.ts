import apiClient from './api';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQuery,
  SuccessResponse,
} from '../types';

const BASE_PATH = '/v1/categories';

/**
 * Get all categories
 * @param query - Optional query parameters (parentId, includeChildren, includeRoot)
 */
export const getAllCategories = async (query?: CategoryQuery): Promise<Category[]> => {
  const response = await apiClient.get<SuccessResponse<Category[]>>(BASE_PATH, {
    params: query,
  });
  return response.data.data;
};

/**
 * Get category by ID
 * @param id - Category UUID
 * @param includeChildren - Whether to include child categories
 */
export const getCategoryById = async (id: string, includeChildren = false): Promise<Category> => {
  const response = await apiClient.get<SuccessResponse<Category>>(`${BASE_PATH}/${id}`, {
    params: { includeChildren },
  });
  return response.data.data;
};

/**
 * Create a new category
 * @param data - Category creation data
 */
export const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
  const response = await apiClient.post<SuccessResponse<Category>>(BASE_PATH, data);
  return response.data.data;
};

/**
 * Update a category
 * @param id - Category UUID
 * @param data - Category update data
 */
export const updateCategory = async (id: string, data: UpdateCategoryDto): Promise<Category> => {
  const response = await apiClient.put<SuccessResponse<Category>>(`${BASE_PATH}/${id}`, data);
  return response.data.data;
};

/**
 * Delete a category
 * Cannot delete if category has children or is used in transactions
 * @param id - Category UUID
 */
export const deleteCategory = async (id: string): Promise<Category> => {
  const response = await apiClient.delete<SuccessResponse<Category>>(`${BASE_PATH}/${id}`);
  return response.data.data;
};

/**
 * Get full category hierarchy as a tree
 * Returns root categories with nested children
 */
export const getCategoryHierarchy = async (): Promise<Category[]> => {
  const response = await apiClient.get<SuccessResponse<Category[]>>(`${BASE_PATH}/hierarchy`);
  return response.data.data;
};

/**
 * Get category with transaction count
 * @param id - Category UUID
 * @param includeChildren - Whether to count transactions in child categories
 */
export const getCategoryStats = async (id: string, includeChildren = false): Promise<Category> => {
  const response = await apiClient.get<SuccessResponse<Category>>(`${BASE_PATH}/${id}/stats`, {
    params: { includeChildren },
  });
  return response.data.data;
};
