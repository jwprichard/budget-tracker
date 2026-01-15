import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

interface TransactionInput {
  description: string;
  merchant?: string;
  amount: number;
  type: string;
  isFromBank: boolean;
  externalTransaction?: {
    category?: string; // JSON string containing full Akahu category data
  };
}

interface AkahuCategory {
  _id: string;
  name: string;
  groups?: {
    personal_finance?: {
      _id: string;
      name: string;
    };
  };
}

interface CategorizationResult {
  categoryId: string | null;
  confidence: number;
  source: 'akahu' | 'manual';
}

/**
 * Categorization Service
 *
 * Auto-creates categories from Akahu data and assigns them to transactions.
 * Categories are created on-the-fly as they are encountered during sync.
 */
export class CategorizationService {
  private categoryCache = new Map<string, string>(); // akahuCategory -> categoryId

  constructor(private prisma: PrismaClient) {}

  /**
   * Categorize a transaction using Akahu category data
   * Auto-creates categories with hierarchy if they don't exist
   */
  async categorizeTransaction(
    transaction: TransactionInput,
    _userId: string // Will be used in Phase 2 for user-specific rules
  ): Promise<CategorizationResult> {
    // Try Akahu category mapping (if transaction is from bank)
	logger.info('[CategorisationService categorising transaction', {transaction: transaction})
    if (transaction.isFromBank && transaction.externalTransaction?.category) {
      try {
        // Parse category JSON
        const akahuCategory: AkahuCategory = JSON.parse(
          transaction.externalTransaction.category
        );

        logger.info('[CategorizationService] Parsed Akahu category', {
          categoryName: akahuCategory.name,
          parentName: akahuCategory.groups?.personal_finance?.name,
        });

        // Extract parent and child names
        const parentName = akahuCategory.groups?.personal_finance?.name;
        const childName = akahuCategory.name;

        // Create/get category with hierarchy
        const category = await this.getOrCreateCategoryWithHierarchy(
          childName,
          parentName
        );

        if (category) {
          return {
            categoryId: category.id,
            confidence: 90,
            source: 'akahu',
          };
        }
      } catch (error) {
        logger.error('[CategorizationService] Error creating category', {
          categoryJson: transaction.externalTransaction.category,
          error,
        });
      }
    }

    // Fallback to "Uncategorized"
    const uncategorized = await this.getUncategorizedCategory();
    return {
      categoryId: uncategorized ? uncategorized.id : null,
      confidence: 0,
      source: 'manual',
    };
  }

  /**
   * Get or create category with parent-child hierarchy
   *
   * Creates both parent and child categories if they don't exist.
   * Example: childName="Supermarkets and grocery stores", parentName="Food"
   * Creates: Food (parent) → Supermarkets And Grocery Stores (child)
   *
   * @param childName - Child category name from Akahu
   * @param parentName - Parent category name from Akahu groups (optional)
   * @returns Child category record
   */
  private async getOrCreateCategoryWithHierarchy(
    childName: string,
    parentName?: string
  ) {
    const cleanedChildName = this.cleanCategoryName(childName);

    // If no parent name provided, create as top-level category
    if (!parentName) {
      return this.getOrCreateTopLevelCategory(cleanedChildName);
    }

    const cleanedParentName = this.cleanCategoryName(parentName);
    const cacheKey = `${cleanedParentName}:${cleanedChildName}`.toLowerCase();

    // Check cache first
    if (this.categoryCache.has(cacheKey)) {
      const categoryId = this.categoryCache.get(cacheKey)!;
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (category) {
        return category;
      }
      // Cache is stale, remove it
      this.categoryCache.delete(cacheKey);
    }

    // Get or create parent category
    const parentCategory = await this.getOrCreateTopLevelCategory(cleanedParentName);

    // Try to find existing child category
    let childCategory = await this.prisma.category.findFirst({
      where: {
        name: cleanedChildName,
        parentId: parentCategory.id,
        userId: null, // System categories only
      },
    });

    if (!childCategory) {
      // Create child category under parent
      logger.info('[CategorizationService] Creating child category', {
        childName: cleanedChildName,
        parentName: cleanedParentName,
        parentId: parentCategory.id,
      });

      childCategory = await this.prisma.category.create({
        data: {
          name: cleanedChildName,
          color: this.generateColor(),
          parentId: parentCategory.id,
          userId: null, // System category
        },
      });
    }

    // Cache the child category ID
    this.categoryCache.set(cacheKey, childCategory.id);
    return childCategory;
  }

  /**
   * Get or create top-level category (no parent)
   *
   * @param categoryName - Cleaned category name
   * @returns Category record
   */
  private async getOrCreateTopLevelCategory(categoryName: string) {
    const normalized = categoryName.toLowerCase();

    // Check cache first
    if (this.categoryCache.has(normalized)) {
      const categoryId = this.categoryCache.get(normalized)!;
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (category) {
        return category;
      }
      // Cache is stale, remove it
      this.categoryCache.delete(normalized);
    }

    // Try to find existing category by name (already cleaned)
    let category = await this.prisma.category.findFirst({
      where: {
        name: categoryName,
        userId: null, // System categories only
        parentId: null, // Top-level only
      },
    });

    if (!category) {
      // Create new top-level category
      logger.info('[CategorizationService] Creating top-level category', {
        categoryName,
      });

      category = await this.prisma.category.create({
        data: {
          name: categoryName,
          color: this.generateColor(),
          userId: null, // System category
          parentId: null, // Top-level
        },
      });
    }

    // Cache the category ID
    this.categoryCache.set(normalized, category.id);
    return category;
  }

  /**
   * Clean category name from Akahu format
   *
   * Examples:
   * - "groceries" -> "Groceries"
   * - "fast-food" -> "Fast Food"
   * - "supermarkets and grocery stores" -> "Supermarkets And Grocery Stores"
   *
   * @param name - Raw Akahu category name
   * @returns Cleaned, title-cased category name
   */
  private cleanCategoryName(name: string): string {
    return name
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .split(/\s+/) // Split by whitespace
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate a random color for new categories
   * Uses Material Design color palette
   */
  private generateColor(): string {
    const colors = [
      '#F44336', // Red
      '#E91E63', // Pink
      '#9C27B0', // Purple
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#2196F3', // Blue
      '#03A9F4', // Light Blue
      '#00BCD4', // Cyan
      '#009688', // Teal
      '#4CAF50', // Green
      '#8BC34A', // Light Green
      '#CDDC39', // Lime
      '#FFEB3B', // Yellow
      '#FFC107', // Amber
      '#FF9800', // Orange
      '#FF5722', // Deep Orange
      '#795548', // Brown
      '#607D8B', // Blue Grey
    ];

    const index = Math.floor(Math.random() * colors.length);
    return colors[index] || '#757575'; // Fallback to grey
  }

  /**
   * Get the "Uncategorized" system category
   */
  private async getUncategorizedCategory() {
    return this.prisma.category.findFirst({
      where: { name: 'Uncategorized', userId: null },
    });
  }

  /**
   * Clear the category cache (useful for testing)
   */
  clearCache(): void {
    this.categoryCache.clear();
  }
}
