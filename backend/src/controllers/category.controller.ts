import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../schemas/category.schema';

const prisma = new PrismaClient();
const categoryService = new CategoryService(prisma);

/**
 * Get all categories
 * Query params: parentId (string), includeChildren (boolean), includeRoot (boolean)
 */
export const getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parentId = req.query['parentId'] as string | undefined;
    const includeChildren = req.query['includeChildren'] === 'true';

    const categories = await categoryService.getAllCategories(userId, parentId, includeChildren);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * Route params: id
 * Query params: includeChildren (boolean)
 */
export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const includeChildren = req.query['includeChildren'] === 'true';
    const category = await categoryService.getCategoryById(req.params['id'] ?? '', userId, includeChildren);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * Body: CreateCategoryDto
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const category = await categoryService.createCategory(req.body as CreateCategoryDto, userId);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * Route params: id
 * Body: UpdateCategoryDto
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const category = await categoryService.updateCategory(req.params['id'] ?? '', req.body as UpdateCategoryDto, userId);

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * Cannot delete if category has children or is used in transactions
 * Route params: id
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const category = await categoryService.deleteCategory(req.params['id'] ?? '', userId);

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get full category hierarchy as a tree
 */
export const getCategoryHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const hierarchy = await categoryService.getCategoryHierarchy(userId);

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category with transaction count
 * Route params: id
 * Query params: includeChildren (boolean)
 */
export const getCategoryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const includeChildren = req.query['includeChildren'] === 'true';
    const categoryStats = await categoryService.getCategoryWithTransactionCount(req.params['id'] ?? '', userId, includeChildren);

    res.status(200).json({
      success: true,
      data: categoryStats,
    });
  } catch (error) {
    next(error);
  }
};
