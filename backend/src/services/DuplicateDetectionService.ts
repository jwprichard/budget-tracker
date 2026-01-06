import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Result of duplicate detection
 */
export interface DuplicateMatch {
  transactionId: string;
  confidence: number; // 0-100
  reason: string;
}

/**
 * Duplicate Detection Service
 *
 * Implements intelligent duplicate detection using multiple strategies:
 * 1. Exact match: date + amount + description (98% confidence)
 * 2. Near match: date ±2 days + amount + fuzzy description (70-94% confidence)
 *
 * This helps avoid importing transactions that already exist in the system.
 */
export class DuplicateDetectionService {
  /**
   * Find potential duplicate transactions
   * Returns matches sorted by confidence (highest first)
   *
   * @param externalTransaction - External transaction to check for duplicates
   * @param localAccountId - Local account ID to search within
   * @returns Array of potential matches with confidence scores
   */
  async findDuplicates(
    externalTransaction: {
      date: Date;
      amount: number;
      description: string;
    },
    localAccountId: string
  ): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];

    try {
      // Strategy 1: Exact match (date + amount + description)
      const exactMatches = await this.findExactMatches(externalTransaction, localAccountId);
      matches.push(...exactMatches);

      // Strategy 2: Near match (date ±2 days + amount + fuzzy description)
      // Only check if no exact matches found
      if (matches.length === 0) {
        const nearMatches = await this.findNearMatches(externalTransaction, localAccountId);
        matches.push(...nearMatches);
      }

      // Sort by confidence descending
      matches.sort((a, b) => b.confidence - a.confidence);

      logger.debug('[DuplicateDetection] Found matches', {
        date: externalTransaction.date,
        amount: externalTransaction.amount,
        description: externalTransaction.description.substring(0, 30),
        matchCount: matches.length,
        highestConfidence: matches[0]?.confidence ?? 0,
      });

      return matches;
    } catch (error) {
      logger.error('[DuplicateDetection] Error finding duplicates', { error });
      return []; // Return empty array on error to allow sync to continue
    }
  }

  /**
   * Exact match strategy
   * Same date, amount, and description (case-insensitive)
   *
   * @param externalTransaction - Transaction to match
   * @param localAccountId - Account to search within
   * @returns Array of exact matches
   */
  private async findExactMatches(
    externalTransaction: {
      date: Date;
      amount: number;
      description: string;
    },
    localAccountId: string
  ): Promise<DuplicateMatch[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: localAccountId,
        date: externalTransaction.date,
        amount: externalTransaction.amount,
        description: {
          contains: externalTransaction.description,
          mode: 'insensitive',
        },
        isFromBank: false, // Don't match against already-imported transactions
      },
      take: 5, // Limit to top 5 matches
    });

    return transactions.map((tx) => ({
      transactionId: tx.id,
      confidence: 98, // Very high confidence for exact matches
      reason: 'Exact match: date, amount, and description',
    }));
  }

  /**
   * Near match strategy
   * Date ±2 days, exact amount, similar description (fuzzy match)
   *
   * @param externalTransaction - Transaction to match
   * @param localAccountId - Account to search within
   * @returns Array of near matches with confidence scores
   */
  private async findNearMatches(
    externalTransaction: {
      date: Date;
      amount: number;
      description: string;
    },
    localAccountId: string
  ): Promise<DuplicateMatch[]> {
    // Calculate date range: ±2 days
    const dateFrom = new Date(externalTransaction.date);
    dateFrom.setDate(dateFrom.getDate() - 2);

    const dateTo = new Date(externalTransaction.date);
    dateTo.setDate(dateTo.getDate() + 2);

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: localAccountId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
        amount: externalTransaction.amount,
        isFromBank: false,
      },
      take: 10, // Limit to top 10 matches
    });

    const matches: DuplicateMatch[] = [];

    for (const tx of transactions) {
      // Calculate string similarity using Levenshtein distance
      const similarity = this.calculateStringSimilarity(
        externalTransaction.description.toLowerCase(),
        tx.description.toLowerCase()
      );

      // Only consider matches with >70% similarity
      if (similarity > 0.7) {
        const daysDiff = Math.abs(this.daysDifference(tx.date, externalTransaction.date));

        // Confidence calculation:
        // - Base: similarity * 85 (max 85% for near matches)
        // - Penalty: -5% for each day difference
        const confidence = Math.floor(similarity * 85 - daysDiff * 5);

        matches.push({
          transactionId: tx.id,
          confidence: Math.max(confidence, 50), // Minimum 50% confidence
          reason: `Near match: date ±${daysDiff} days, exact amount, ${Math.floor(
            similarity * 100
          )}% description similarity`,
        });
      }
    }

    return matches;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns value between 0 (no match) and 1 (perfect match)
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0-1)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   * Measures the minimum number of single-character edits required
   * to change one string into another
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize first column
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!; // No operation needed
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1, // Substitution
            matrix[i]![j - 1]! + 1, // Insertion
            matrix[i - 1]![j]! + 1 // Deletion
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Calculate days difference between two dates
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns Number of days difference
   */
  private daysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
