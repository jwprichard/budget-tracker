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

export class CategorizationService {
  private akahuMappingCache = new Map<string, { categoryId: string; confidence: number }>();

  constructor(private prisma: PrismaClient) {}

  /**
   * Categorize a transaction using Akahu mapping only (Phase 1)
   * Phase 2 will add rule evaluation
   */
  async categorizeTransaction(
    transaction: TransactionInput,
    userId: string
  ): Promise<CategorizationResult> {
    // Try Akahu category mapping (if transaction is from bank)
    if (transaction.isFromBank && transaction.externalTransaction?.category) {
      const mapping = await this.mapAkahuCategory(transaction.externalTransaction.category);
      if (mapping) {
        return { categoryId: mapping.categoryId, confidence: mapping.confidence, source: 'akahu' };
      }
    }

    // Fallback to "Uncategorized"
    const uncategorized = await this.getUncategorizedCategory();
    return { categoryId: uncategorized ? uncategorized.id : null, confidence: 0, source: 'manual' };
  }

  /**
   * Map Akahu category to local category
   */
  async mapAkahuCategory(akahuCategory: string): Promise<{ categoryId: string; confidence: number } | null> {
    const normalized = akahuCategory.toLowerCase();

    // Check cache
    if (this.akahuMappingCache.has(normalized)) {
      return this.akahuMappingCache.get(normalized)!;
    }

    // Query database
    const mapping = await this.prisma.akahuCategoryMapping.findUnique({
      where: { akahuCategory: normalized },
    });

    if (mapping) {
      const result = { categoryId: mapping.localCategoryId, confidence: mapping.confidence };
      this.akahuMappingCache.set(normalized, result);
      return result;
    }

    // Unknown category - log for future mapping
    logger.warn('[CategorizationService] Unknown Akahu category', { akahuCategory });
    return null;
  }

  /**
   * Get the "Uncategorized" system category
   */
  private async getUncategorizedCategory() {
    return this.prisma.category.findFirst({
      where: { name: 'Uncategorized', userId: null },
    });
  }
}
