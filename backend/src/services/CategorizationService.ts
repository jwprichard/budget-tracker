import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

interface TransactionInput {
  description: string;
  merchant?: string;
  amount: number;
  type: string;
  isFromBank: boolean;
  externalTransaction?: {
    category?: string;
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
   * Auto-creates categories if they don't exist
   */
  async categorizeTransaction(
    transaction: TransactionInput,
    _userId: string // Will be used in Phase 2 for user-specific rules
  ): Promise<CategorizationResult> {
    // Try Akahu category mapping (if transaction is from bank)
    if (transaction.isFromBank && transaction.externalTransaction?.category) {
      try {
        const category = await this.getOrCreateCategory(
          transaction.externalTransaction.category
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
          akahuCategory: transaction.externalTransaction.category,
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
   * Get or create category from Akahu category name
   *
   * Cleans the category name (capitalize, remove hyphens) and creates it if needed.
   * Categories are stored as system categories (userId = null) and appear as top-level.
   *
   * @param akahuCategory - Raw category name from Akahu (e.g., "groceries", "fast-food")
   * @returns Category record
   */
  private async getOrCreateCategory(akahuCategory: string) {
    const normalized = akahuCategory.toLowerCase();

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

    // Clean the category name (capitalize, remove hyphens)
    const cleanedName = this.cleanCategoryName(akahuCategory);

    // Try to find existing category by cleaned name
    let category = await this.prisma.category.findFirst({
      where: {
        name: cleanedName,
        userId: null, // System categories only
      },
    });

    if (!category) {
      // Create new category
      logger.info('[CategorizationService] Creating new category from Akahu', {
        akahuCategory,
        cleanedName,
      });

      category = await this.prisma.category.create({
        data: {
          name: cleanedName,
          color: this.generateColor(),
          userId: null, // System category (visible to all users in future multi-user setup)
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
   * - "health-beauty" -> "Health Beauty"
   *
   * @param name - Raw Akahu category name
   * @returns Cleaned, capitalized category name
   */
  private cleanCategoryName(name: string): string {
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
