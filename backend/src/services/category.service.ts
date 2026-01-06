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
   * Get all categories
   * @param parentId - Optional parent category ID to filter by
   * @param includeChildren - Whether to include child categories (default: false)
   */
  async getAllCategories(parentId?: string, includeChildren: boolean = false): Promise<CategoryWithChildren[]> {
    const categories = await this.prisma.category.findMany({
      where: parentId !== undefined ? { parentId } : { parentId: null },
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
   * Get category by ID
   * @param id - Category UUID
   * @param includeChildren - Whether to include child categories (default: false)
   * @throws AppError if category not found
   */
  async getCategoryById(id: string, includeChildren: boolean = false): Promise<CategoryWithChildren> {
    const category = await this.prisma.category.findUnique({
      where: { id },
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
   * @throws AppError if parent category not found
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    // If parentId is provided, verify parent exists
    if (data.parentId) {
      await this.getCategoryById(data.parentId);
    }

    return this.prisma.category.create({
      data: {
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
   * @throws AppError if category not found or circular reference detected
   */
  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    // Verify category exists
    await this.getCategoryById(id);

    // If updating parentId, check for circular reference
    if (data.parentId !== undefined) {
      // Cannot set itself as parent
      if (data.parentId === id) {
        throw new AppError('Category cannot be its own parent', 400);
      }

      // If parentId is not null, check for circular reference
      if (data.parentId) {
        await this.checkCircularReference(id, data.parentId);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a category
   * Cannot delete if category has children or is used in transactions
   * @param id - Category UUID
   * @throws AppError if category not found, has children, or has transactions
   */
  async deleteCategory(id: string): Promise<Category> {
    // Verify category exists
    const category = await this.getCategoryById(id, true);

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new AppError('Cannot delete category with child categories', 400);
    }

    // Check if category is used in transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new AppError('Cannot delete category that is used in transactions', 400);
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Get full category hierarchy as a tree
   * Builds a hierarchical tree structure of all categories
   */
  async getCategoryHierarchy(): Promise<CategoryWithChildren[]> {
    // Get all categories
    const allCategories = await this.prisma.category.findMany({
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
   * Get category with transaction count
   * @param id - Category UUID
   * @param includeChildren - Whether to count transactions in child categories (default: false)
   * @throws AppError if category not found
   */
  async getCategoryWithTransactionCount(id: string, includeChildren: boolean = false): Promise<CategoryWithChildren> {
    const category = await this.getCategoryById(id, includeChildren);

    let transactionCount: number;

    if (includeChildren) {
      // Get all descendant category IDs
      const descendantIds = await this.getDescendantIds(id);
      transactionCount = await this.prisma.transaction.count({
        where: {
          categoryId: {
            in: [id, ...descendantIds],
          },
        },
      });
    } else {
      transactionCount = await this.prisma.transaction.count({
        where: { categoryId: id },
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
   * @throws AppError if circular reference detected
   */
  private async checkCircularReference(categoryId: string, newParentId: string): Promise<void> {
    // Verify new parent exists
    await this.getCategoryById(newParentId);

    // Check if newParentId is a descendant of categoryId
    const descendants = await this.getDescendantIds(categoryId);

    if (descendants.includes(newParentId)) {
      throw new AppError('Cannot create circular reference in category hierarchy', 400);
    }
  }

  /**
   * Get all descendant category IDs recursively
   * @param categoryId - Parent category ID
   * @returns Array of descendant category IDs
   */
  private async getDescendantIds(categoryId: string): Promise<string[]> {
    const descendants: string[] = [];

    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getDescendantIds(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}
