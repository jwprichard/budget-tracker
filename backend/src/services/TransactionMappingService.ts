import { TransactionType, TransactionStatus } from '@prisma/client';

/**
 * Transaction Mapping Service
 *
 * Maps external transactions (from banking providers) to local transaction format.
 * This service is responsible for:
 * - Determining transaction type (INCOME/EXPENSE)
 * - Cleaning and formatting descriptions
 * - Building notes with metadata
 * - Setting appropriate status
 */
export class TransactionMappingService {
  /**
   * Map external transaction to local transaction create input
   *
   * @param externalTransaction - Transaction from banking provider
   * @param localAccountId - Local account ID to assign
   * @returns Transaction data ready for Prisma create
   */
  mapToLocalTransaction(
    externalTransaction: {
      date: Date;
      amount: number;
      description: string;
      merchant?: string;
      category?: string;
      type?: string;
      balance?: number;
    },
    localAccountId: string
  ) {
    // Determine transaction type based on amount
    // Positive = INCOME, Negative = EXPENSE
    const type: TransactionType =
      externalTransaction.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;

    // Clean and format description
    const description = this.cleanDescription(externalTransaction);

    // Build notes with additional metadata
    const notes = this.buildNotes(externalTransaction);

    return {
      accountId: localAccountId,
      type,
      amount: externalTransaction.amount,
      date: externalTransaction.date,
      description,
      notes,
      status: TransactionStatus.CLEARED, // Bank transactions are already cleared
      categoryId: null, // Will be assigned by categorization rules later (Milestone 3.5)
      isFromBank: true,
    };
  }

  /**
   * Clean and format transaction description
   *
   * Priority:
   * 1. Merchant name (if available and different from description)
   * 2. Original description (cleaned)
   *
   * @param externalTransaction - Transaction from provider
   * @returns Cleaned description
   */
  private cleanDescription(externalTransaction: {
    description: string;
    merchant?: string;
  }): string {
    // Use merchant name if available and different from description
    if (externalTransaction.merchant) {
      const merchantLower = externalTransaction.merchant.toLowerCase();
      const descriptionLower = externalTransaction.description.toLowerCase();

      // If merchant name is not contained in description, prefer merchant
      if (!descriptionLower.includes(merchantLower)) {
        return this.cleanString(externalTransaction.merchant);
      }
    }

    // Otherwise, clean and use original description
    return this.cleanString(externalTransaction.description);
  }

  /**
   * Build notes field with additional metadata
   *
   * Includes:
   * - Original bank description (if different from cleaned description)
   * - Bank category (if available)
   * - Balance after transaction (if available)
   *
   * @param externalTransaction - Transaction from provider
   * @returns Notes string or null if no additional info
   */
  private buildNotes(externalTransaction: {
    description: string;
    merchant?: string;
    category?: string;
    balance?: number;
  }): string | null {
    const notes: string[] = [];

    // Add original bank description if merchant was used
    if (
      externalTransaction.merchant &&
      externalTransaction.merchant !== externalTransaction.description
    ) {
      notes.push(`Bank description: ${externalTransaction.description}`);
    }

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
