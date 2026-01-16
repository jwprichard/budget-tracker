import { PrismaClient, CategoryRule } from '@prisma/client';
import logger from '../utils/logger';
import { RuleConditions, TextMatch } from '../types/rule.types';

interface TransactionInput {
  description: string;
  merchant?: string;
  amount: number;
  type: string;
  isFromBank: boolean;
  notes?: string;
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
  source: 'rule' | 'akahu' | 'manual';
  ruleId?: string; // ID of the rule that matched (if applicable)
}

/**
 * Categorization Service
 *
 * Phase 1: Auto-creates categories from Akahu data
 * Phase 2: Evaluates user-defined rules for categorization
 *
 * Categorization priority:
 * 1. User-defined rules (highest priority first)
 * 2. Akahu category mapping (if from bank)
 * 3. Uncategorized (fallback)
 */
export class CategorizationService {
  private categoryCache = new Map<string, string>(); // akahuCategory -> categoryId
  private ruleCache = new Map<string, CategoryRule[]>(); // userId -> rules

  constructor(private prisma: PrismaClient) {}

  /**
   * Categorize a transaction using rules and Akahu category data
   * Phase 2: Now evaluates user-defined rules first
   * Auto-creates categories with hierarchy if they don't exist
   */
  async categorizeTransaction(
    transaction: TransactionInput,
    userId: string
  ): Promise<CategorizationResult> {
    logger.info('[CategorizationService] Categorizing transaction', {
      description: transaction.description,
      merchant: transaction.merchant,
      isFromBank: transaction.isFromBank,
    });

    // Step 1: Evaluate user rules (priority order)
    const userRules = await this.getRulesForUser(userId);
    for (const rule of userRules) {
      if (await this.matchesRule(transaction, rule)) {
        logger.info('[CategorizationService] Rule matched', {
          ruleId: rule.id,
          ruleName: rule.name,
          categoryId: rule.categoryId,
        });

        // Increment match count asynchronously (don't wait)
        this.incrementRuleMatchCount(rule.id).catch((err) =>
          logger.error('[CategorizationService] Failed to increment match count', { err })
        );

        return {
          categoryId: rule.categoryId,
          confidence: 90,
          source: 'rule',
          ruleId: rule.id,
        };
      }
    }

    // Step 2: Try Akahu category mapping (if transaction is from bank)
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
   * Get user's enabled rules (cached, priority order)
   */
  private async getRulesForUser(userId: string): Promise<CategoryRule[]> {
    const cacheKey = `rules:${userId}`;
    if (this.ruleCache.has(cacheKey)) {
      return this.ruleCache.get(cacheKey)!;
    }

    const rules = await this.prisma.categoryRule.findMany({
      where: {
        userId,
        isEnabled: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    this.ruleCache.set(cacheKey, rules);
    return rules;
  }

  /**
   * Check if transaction matches rule (text rules only for Phase 2)
   */
  private matchesRule(transaction: TransactionInput, rule: CategoryRule): boolean {
    const conditions = rule.conditions as unknown as RuleConditions;

    if (conditions.type !== 'text') {
      return false; // Only text rules in Phase 2
    }

    return this.matchTextCondition(transaction, conditions.textMatch);
  }

  /**
   * Match text condition against transaction
   */
  private matchTextCondition(transaction: TransactionInput, match: TextMatch): boolean {
    // Get the field value to match against
    let fieldValue = '';
    switch (match.field) {
      case 'description':
        fieldValue = transaction.description || '';
        break;
      case 'merchant':
        fieldValue = transaction.merchant || '';
        break;
      case 'notes':
        fieldValue = transaction.notes || '';
        break;
      default:
        return false;
    }

    // Apply case sensitivity
    const searchValue = match.caseSensitive ? match.value : match.value.toLowerCase();
    const fieldText = match.caseSensitive ? fieldValue : fieldValue.toLowerCase();

    // Apply operator
    switch (match.operator) {
      case 'contains':
        return fieldText.includes(searchValue);
      case 'exact':
        return fieldText === searchValue;
      case 'startsWith':
        return fieldText.startsWith(searchValue);
      case 'endsWith':
        return fieldText.endsWith(searchValue);
      default:
        return false;
    }
  }

  /**
   * Increment rule match count (called when rule matches a transaction)
   */
  private async incrementRuleMatchCount(ruleId: string): Promise<void> {
    await this.prisma.categoryRule.update({
      where: { id: ruleId },
      data: {
        matchCount: { increment: 1 },
        lastMatched: new Date(),
      },
    });
  }

  /**
   * Invalidate rule cache (call when rules change)
   */
  invalidateRuleCache(userId: string): void {
    this.ruleCache.delete(`rules:${userId}`);
  }

  /**
   * Clear all caches (useful for testing)
   */
  clearCache(): void {
    this.categoryCache.clear();
    this.ruleCache.clear();
  }
}
