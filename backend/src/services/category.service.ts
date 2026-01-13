import { PrismaClient, Category } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto } from '../schemas/category.schema';
import { AppError } from '../middlewares/errorHandler';

type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
  _count?: {
    transactions: number;
  };
};

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all categories (system categories + user's own categories)
   * @param userId - User UUID
   * @param parentId - Optional parent category ID to filter by
   * @param includeChildren - Whether to include child categories (default: false)
   */
  async getAllCategories(userId: string, parentId?: string, includeChildren: boolean = false): Promise<CategoryWithChildren[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        ...(parentId !== undefined ? { parentId } : { parentId: null }),
        OR: [
          { userId: null }, // System categories
          { userId }, // User's own categories
        ],
      },
      include: includeChildren
        ? {
            children: {
              orderBy: { name: 'asc' },
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  /**
   * Get category by ID (allows access to system categories + user's own)
   * @param id - Category UUID
   * @param userId - User UUID
   * @param includeChildren - Whether to include child categories (default: false)
   * @throws AppError if category not found or doesn't belong to user
   */
  async getCategoryById(id: string, userId: string, includeChildren: boolean = false): Promise<CategoryWithChildren> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // System category
          { userId }, // User's own category
        ],
      },
      include: includeChildren
        ? {
            children: {
              orderBy: { name: 'asc' },
            },
            parent: true,
          }
        : { parent: true },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  /**
   * Create a new category
   * @param data - Category creation data
   * @param userId - User UUID
   * @throws AppError if parent category not found or doesn't belong to user
   */
  async createCategory(data: CreateCategoryDto, userId: string): Promise<Category> {
    // If parentId is provided, verify parent exists and is accessible to user
    if (data.parentId) {
      await this.getCategoryById(data.parentId, userId);
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: data.name,
        color: data.color || '#757575',
        icon: data.icon,
        parentId: data.parentId,
      },
    });
  }

  /**
   * Update an existing category
   * @param id - Category UUID
   * @param data - Category update data
   * @param userId - User UUID
   * @throws AppError if category not found, doesn't belong to user, is a system category, or circular reference detected
   */
  async updateCategory(id: string, data: UpdateCategoryDto, userId: string): Promise<Category> {
    // Verify category exists and belongs to user (cannot update system categories)
    const category = await this.prisma.category.findFirst({
      where: { id, userId }, // Must be user's own category
    });

    if (!category) {
      throw new AppError('Category not found or cannot be updated', 404);
    }

    // If updating parentId, check for circular reference
    if (data.parentId !== undefined) {
      // Cannot set itself as parent
      if (data.parentId === id) {
        throw new AppError('Category cannot be its own parent', 400);
      }

      // If parentId is not null, check for circular reference
      if (data.parentId) {
        await this.checkCircularReference(id, data.parentId, userId);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a category
   * Cannot delete system categories or categories with children or transactions
   * @param id - Category UUID
   * @param userId - User UUID
   * @throws AppError if category not found, doesn't belong to user, is a system category, has children, or has transactions
   */
  async deleteCategory(id: string, userId: string): Promise<Category> {
    // Verify category exists and belongs to user (cannot delete system categories)
    const category = await this.prisma.category.findFirst({
      where: { id, userId }, // Must be user's own category
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new AppError('Category not found or cannot be deleted', 404);
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new AppError('Cannot delete category with child categories', 400);
    }

    // Check if category is used in user's transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id, userId },
    });

    if (transactionCount > 0) {
      throw new AppError('Cannot delete category that is used in transactions', 400);
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Get full category hierarchy as a tree (system categories + user's own)
   * Builds a hierarchical tree structure of all accessible categories
   * @param userId - User UUID
   */
  async getCategoryHierarchy(userId: string): Promise<CategoryWithChildren[]> {
    // Get all categories accessible to user (system + user's own)
    const allCategories = await this.prisma.category.findMany({
      where: {
        OR: [
          { userId: null }, // System categories
          { userId }, // User's own categories
        ],
      },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create map
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree
    allCategories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children!.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  /**
   * Get category with transaction count (filtered by user)
   * @param id - Category UUID
   * @param userId - User UUID
   * @param includeChildren - Whether to count transactions in child categories (default: false)
   * @throws AppError if category not found or doesn't belong to user
   */
  async getCategoryWithTransactionCount(id: string, userId: string, includeChildren: boolean = false): Promise<CategoryWithChildren> {
    const category = await this.getCategoryById(id, userId, includeChildren);

    let transactionCount: number;

    if (includeChildren) {
      // Get all descendant category IDs
      const descendantIds = await this.getDescendantIds(id, userId);
      transactionCount = await this.prisma.transaction.count({
        where: {
          userId, // Only count user's transactions
          categoryId: {
            in: [id, ...descendantIds],
          },
        },
      });
    } else {
      transactionCount = await this.prisma.transaction.count({
        where: { categoryId: id, userId }, // Only count user's transactions
      });
    }

    return {
      ...category,
      _count: {
        transactions: transactionCount,
      },
    };
  }

  /**
   * Check for circular reference in category hierarchy
   * @param categoryId - Category being updated
   * @param newParentId - New parent ID
   * @param userId - User UUID
   * @throws AppError if circular reference detected
   */
  private async checkCircularReference(categoryId: string, newParentId: string, userId: string): Promise<void> {
    // Verify new parent exists and is accessible
    await this.getCategoryById(newParentId, userId);

    // Check if newParentId is a descendant of categoryId
    const descendants = await this.getDescendantIds(categoryId, userId);

    if (descendants.includes(newParentId)) {
      throw new AppError('Cannot create circular reference in category hierarchy', 400);
    }
  }

  /**
   * Get all descendant category IDs recursively (for accessible categories)
   * @param categoryId - Parent category ID
   * @param userId - User UUID
   * @returns Array of descendant category IDs
   */
  private async getDescendantIds(categoryId: string, userId: string): Promise<string[]> {
    const descendants: string[] = [];

    const children = await this.prisma.category.findMany({
      where: {
        parentId: categoryId,
        OR: [
          { userId: null }, // System categories
          { userId }, // User's own categories
        ],
      },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getDescendantIds(child.id, userId);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}
