import { TransactionType, TransactionStatus } from '@prisma/client';
import { CategorizationService } from './CategorizationService';

/**
 * Transaction Mapping Service
 *
 * Maps external transactions (from banking providers) to local transaction format.
 * This service is responsible for:
 * - Determining transaction type (INCOME/EXPENSE)
 * - Cleaning and formatting descriptions
 * - Building notes with metadata
 * - Auto-categorizing transactions (using CategorizationService)
 * - Setting appropriate status
 */
export class TransactionMappingService {
  constructor(private categorizationService?: CategorizationService) {}
  /**
   * Map external transaction to local transaction create input
   *
   * @param externalTransaction - Transaction from banking provider
   * @param localAccountId - Local account ID to assign
   * @param userId - User ID for categorization
   * @returns Transaction data ready for Prisma create
   */
  async mapToLocalTransaction(
    externalTransaction: {
      date: Date;
      amount: number;
      description: string;
      merchant?: string;
      category?: string;
      type?: string;
      balance?: number;
    },
    localAccountId: string,
    userId: string
  ) {
    // Determine transaction type based on amount
    // Positive = INCOME, Negative = EXPENSE
    const type: TransactionType =
      externalTransaction.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;

    // Keep original bank description (don't collapse with merchant)
    const description = this.cleanString(externalTransaction.description);

    // Store merchant separately if available
    const merchant = externalTransaction.merchant
      ? this.cleanString(externalTransaction.merchant)
      : null;

    // Build notes with metadata (no need to include bank description anymore)
    const notes = this.buildNotesWithMetadata(externalTransaction);

    // Auto-categorize using Akahu data
    let categoryId: string | null = null;
    if (this.categorizationService) {
      const result = await this.categorizationService.categorizeTransaction(
        {
          description,
          merchant: merchant || undefined,
          amount: externalTransaction.amount,
          type,
          isFromBank: true,
          externalTransaction: {
            category: externalTransaction.category,
          },
        },
        userId
      );
      categoryId = result.categoryId;
    }

    return {
      accountId: localAccountId,
      type,
      amount: externalTransaction.amount,
      date: externalTransaction.date,
      description,
      merchant,
      notes,
      status: TransactionStatus.CLEARED, // Bank transactions are already cleared
      categoryId, // Now auto-assigned from Akahu
      isFromBank: true,
    };
  }

  /**
   * Build notes field with metadata
   *
   * Includes:
   * - Bank category (if available)
   * - Balance after transaction (if available)
   *
   * Note: Merchant is now stored in separate field, not in notes
   *
   * @param externalTransaction - Transaction from provider
   * @returns Notes string or null if no additional info
   */
  private buildNotesWithMetadata(externalTransaction: {
    category?: string;
    balance?: number;
  }): string | null {
    const notes: string[] = [];

    // Add bank category if available
    if (externalTransaction.category) {
      notes.push(`Bank category: ${externalTransaction.category}`);
    }

    // Add balance after transaction if available
    if (externalTransaction.balance !== undefined && externalTransaction.balance !== null) {
      notes.push(`Balance after: $${externalTransaction.balance.toFixed(2)}`);
    }

    return notes.length > 0 ? notes.join('\n') : null;
  }

  /**
   * Clean a string by removing extra whitespace and trimming
   *
   * @param str - String to clean
   * @returns Cleaned string
   */
  private cleanString(str: string): string {
    return str
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
  }
}
