/**
 * Matching Service
 * Handles matching actual transactions to planned transactions
 */

import { PrismaClient, Transaction, MatchMethod, Prisma } from '@prisma/client';
import { PlannedTransactionService, PlannedTransactionWithRelations } from './plannedTransaction.service';
import { AppError } from '../middlewares/errorHandler';

// Types for match candidates and results
export interface MatchCandidate {
  transaction: Transaction & {
    account: { id: string; name: string; type: string };
    category?: { id: string; name: string; color: string } | null;
  };
  plannedTransaction: PlannedTransactionWithRelations;
  confidence: number;
  reasons: string[];
}

export interface PendingMatch {
  id: string; // Format: {transactionId}_{plannedId}
  transactionId: string;
  plannedTransactionId: string;
  transaction: Transaction & {
    account: { id: string; name: string; type: string };
    category?: { id: string; name: string; color: string } | null;
  };
  plannedTransaction: {
    id: string;
    templateId: string | null;
    name: string;
    amount: number;
    type: string;
    expectedDate: string;
    accountId: string;
    accountName: string;
    categoryId: string | null;
    categoryName: string | null;
    isVirtual: boolean;
  };
  confidence: number;
  reasons: string[];
  suggestedAt: Date;
}

export interface MatchHistoryItem {
  id: string;
  transactionId: string;
  transaction: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    accountId: string;
    accountName: string;
  };
  plannedTemplateId: string | null;
  plannedExpectedDate: Date;
  plannedAmount: number;
  matchConfidence: number;
  matchedAt: Date;
  matchMethod: MatchMethod;
}

export class MatchingService {
  private plannedService: PlannedTransactionService;

  constructor(private prisma: PrismaClient) {
    this.plannedService = new PlannedTransactionService(prisma);
  }

  /**
   * Find match candidates for a transaction
   * @param transaction - The actual transaction to find matches for
   * @param plannedTransactions - List of planned transactions to match against
   * @returns Array of match candidates sorted by confidence
   */
  findMatchCandidates(
    transaction: Transaction & {
      account: { id: string; name: string; type: string };
      category?: { id: string; name: string; color: string } | null;
    },
    plannedTransactions: PlannedTransactionWithRelations[]
  ): MatchCandidate[] {
    const candidates: MatchCandidate[] = [];

    for (const planned of plannedTransactions) {
      if (!planned.autoMatchEnabled) continue;

      let confidence = 0;
      const reasons: string[] = [];

      // 1. Amount matching (40 points max)
      const transactionAmount = Number(transaction.amount);
      const plannedAmount = planned.amount;
      const amountDiff = Math.abs(transactionAmount - plannedAmount);
      const tolerance = planned.matchTolerance || 0;

      if (amountDiff === 0) {
        confidence += 40;
        reasons.push('Exact amount match');
      } else if (amountDiff <= tolerance) {
        confidence += 30;
        reasons.push(`Amount within tolerance ($${amountDiff.toFixed(2)})`);
      } else if (amountDiff <= Math.abs(plannedAmount) * 0.1) {
        confidence += 15;
        reasons.push('Amount within 10%');
      }

      // 2. Date proximity (30 points max)
      const transactionDate = new Date(transaction.date);
      const expectedDate = new Date(planned.expectedDate);
      const daysDiff = Math.abs(
        Math.floor((transactionDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const windowDays = planned.matchWindowDays || 7;

      if (daysDiff === 0) {
        confidence += 30;
        reasons.push('Exact date match');
      } else if (daysDiff <= 1) {
        confidence += 25;
        reasons.push('Within 1 day');
      } else if (daysDiff <= 3) {
        confidence += 20;
        reasons.push('Within 3 days');
      } else if (daysDiff <= windowDays) {
        confidence += 10;
        reasons.push(`Within ${windowDays} day window`);
      } else {
        // Outside the match window - skip this candidate
        continue;
      }

      // 3. Category match (15 points)
      if (
        transaction.categoryId &&
        planned.categoryId &&
        transaction.categoryId === planned.categoryId
      ) {
        confidence += 15;
        reasons.push('Category match');
      }

      // 4. Account match (15 points)
      if (transaction.accountId === planned.accountId) {
        confidence += 15;
        reasons.push('Account match');
      }

      // Only include if reasonable confidence (>=50%)
      if (confidence >= 50) {
        candidates.push({
          transaction,
          plannedTransaction: planned,
          confidence,
          reasons,
        });
      }
    }

    // Sort by confidence descending
    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get pending match suggestions for review
   * @param userId - User UUID
   * @param limit - Maximum number of suggestions to return
   * @returns Array of pending match suggestions
   */
  async getPendingMatches(userId: string, limit: number = 50): Promise<PendingMatch[]> {
    // Get unmatched transactions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const unmatchedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
        matchedTransaction: null, // Not already matched
      },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 200, // Limit initial batch for performance
    });

    if (unmatchedTransactions.length === 0) {
      return [];
    }

    // Get planned transactions in a window around these transactions
    const minDate = new Date(
      Math.min(...unmatchedTransactions.map((t) => new Date(t.date).getTime()))
    );
    const maxDate = new Date(
      Math.max(...unmatchedTransactions.map((t) => new Date(t.date).getTime()))
    );

    // Extend window by 7 days on each side
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    const plannedTransactions = await this.plannedService.getPlannedTransactions(userId, {
      includeVirtual: true,
      startDate: minDate.toISOString(),
      endDate: maxDate.toISOString(),
    });

    // Get all dismissed matches for these transactions
    const transactionIds = unmatchedTransactions.map((t) => t.id);
    const dismissedMatches = await this.prisma.dismissedMatch.findMany({
      where: {
        transactionId: { in: transactionIds },
      },
    });

    // Create a set of dismissed transaction+planned pairs for quick lookup
    const dismissedPairs = new Set(
      dismissedMatches.map((d) => `${d.transactionId}_${d.plannedTransactionId}`)
    );

    // Find matches for each transaction
    const pendingMatches: PendingMatch[] = [];
    const matchedPlannedIds = new Set<string>();

    for (const transaction of unmatchedTransactions) {
      // Filter out already matched planned transactions in this session
      const availablePlanned = plannedTransactions.filter(
        (p) => !matchedPlannedIds.has(p.id)
      );

      const candidates = this.findMatchCandidates(transaction, availablePlanned);

      // Only include medium confidence matches (70-94%) for review
      // High confidence (>=95%) should auto-match, low (<70%) not suggested
      // Also filter out dismissed matches
      const reviewCandidates = candidates.filter(
        (c) =>
          c.confidence >= 70 &&
          c.confidence < 95 &&
          !dismissedPairs.has(`${transaction.id}_${c.plannedTransaction.id}`)
      );

      if (reviewCandidates.length > 0) {
        const bestMatch = reviewCandidates[0]!;
        matchedPlannedIds.add(bestMatch.plannedTransaction.id);

        pendingMatches.push({
          id: `${transaction.id}_${bestMatch.plannedTransaction.id}`,
          transactionId: transaction.id,
          plannedTransactionId: bestMatch.plannedTransaction.id,
          transaction: bestMatch.transaction,
          plannedTransaction: {
            id: bestMatch.plannedTransaction.id,
            templateId: bestMatch.plannedTransaction.templateId,
            name: bestMatch.plannedTransaction.name,
            amount: bestMatch.plannedTransaction.amount,
            type: bestMatch.plannedTransaction.type,
            expectedDate: bestMatch.plannedTransaction.expectedDate,
            accountId: bestMatch.plannedTransaction.accountId,
            accountName: bestMatch.plannedTransaction.accountName,
            categoryId: bestMatch.plannedTransaction.categoryId,
            categoryName: bestMatch.plannedTransaction.categoryName,
            isVirtual: bestMatch.plannedTransaction.isVirtual,
          },
          confidence: bestMatch.confidence,
          reasons: bestMatch.reasons,
          suggestedAt: new Date(),
        });
      }

      if (pendingMatches.length >= limit) {
        break;
      }
    }

    return pendingMatches;
  }

  /**
   * Auto-match a transaction to planned transactions
   * Called when a new transaction is created/imported
   * @param transactionId - Transaction UUID
   * @param userId - User UUID
   * @returns Match result or null if no high-confidence match found
   */
  async autoMatch(
    transactionId: string,
    userId: string
  ): Promise<{ matched: boolean; matchId?: string; confidence?: number } | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
        matchedTransaction: true,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // Already matched
    if (transaction.matchedTransaction) {
      return { matched: true, matchId: transaction.matchedTransaction.id };
    }

    // Get planned transactions in window around this transaction
    const transactionDate = new Date(transaction.date);
    const startDate = new Date(transactionDate);
    startDate.setDate(startDate.getDate() - 14);
    const endDate = new Date(transactionDate);
    endDate.setDate(endDate.getDate() + 14);

    const plannedTransactions = await this.plannedService.getPlannedTransactions(userId, {
      includeVirtual: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      accountId: transaction.accountId,
    });

    if (plannedTransactions.length === 0) {
      return { matched: false };
    }

    const candidates = this.findMatchCandidates(transaction, plannedTransactions);

    if (candidates.length === 0) {
      return { matched: false };
    }

    const bestMatch = candidates[0]!;

    // Auto-match if confidence >= 95%
    if (bestMatch.confidence >= 95) {
      const matchRecord = await this.confirmMatch(
        transaction.id,
        bestMatch.plannedTransaction.id,
        bestMatch.confidence,
        bestMatch.plannedTransaction.skipReview ? MatchMethod.AUTO : MatchMethod.AUTO,
        userId
      );

      return {
        matched: true,
        matchId: matchRecord.id,
        confidence: bestMatch.confidence,
      };
    }

    return { matched: false };
  }

  /**
   * Confirm a match (from review queue or auto-match)
   * @param transactionId - Transaction UUID
   * @param plannedTransactionId - Planned transaction ID (can be virtual)
   * @param confidence - Match confidence (0-100)
   * @param method - How the match was made
   * @param userId - User UUID
   */
  async confirmMatch(
    transactionId: string,
    plannedTransactionId: string,
    confidence: number,
    method: MatchMethod,
    userId: string
  ): Promise<{ id: string }> {
    // Verify transaction exists and belongs to user
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { matchedTransaction: true },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.matchedTransaction) {
      throw new AppError('Transaction is already matched', 400);
    }

    // Parse the planned transaction ID to get template info
    let templateId: string | null = null;
    let expectedDate: Date;
    let plannedAmount: number;

    if (plannedTransactionId.startsWith('virtual_')) {
      // Virtual planned transaction: virtual_{templateId}_{expectedDateISO}
      const parts = plannedTransactionId.split('_');
      templateId = parts[1] || null;
      const dateStr = parts.slice(2).join('_');
      expectedDate = new Date(dateStr);

      // Get template to find amount
      if (templateId) {
        const template = await this.prisma.plannedTransactionTemplate.findFirst({
          where: { id: templateId, userId },
        });
        if (template) {
          plannedAmount = Number(template.amount);
        } else {
          throw new AppError('Planned transaction template not found', 404);
        }
      } else {
        throw new AppError('Invalid virtual planned transaction ID', 400);
      }
    } else {
      // Stored planned transaction (override or one-time)
      const planned = await this.prisma.plannedTransaction.findFirst({
        where: { id: plannedTransactionId, userId },
      });

      if (!planned) {
        throw new AppError('Planned transaction not found', 404);
      }

      templateId = planned.templateId;
      expectedDate = new Date(planned.expectedDate);
      plannedAmount = Number(planned.amount);

      // Delete the planned transaction since actual transaction is source of truth
      await this.prisma.plannedTransaction.delete({
        where: { id: plannedTransactionId },
      });
    }

    // Create match record
    const matchRecord = await this.prisma.matchedTransaction.create({
      data: {
        transactionId,
        plannedTemplateId: templateId,
        plannedExpectedDate: expectedDate,
        plannedAmount,
        matchConfidence: confidence,
        matchMethod: method,
      },
    });

    return { id: matchRecord.id };
  }

  /**
   * Dismiss a pending match suggestion
   * Persists the dismissal so the match won't reappear in future suggestions
   */
  async dismissMatch(
    transactionId: string,
    plannedTransactionId: string,
    userId: string
  ): Promise<void> {
    // Verify transaction exists and belongs to user
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // Store the dismissed match so it won't appear again
    await this.prisma.dismissedMatch.upsert({
      where: {
        transactionId_plannedTransactionId: {
          transactionId,
          plannedTransactionId,
        },
      },
      update: {
        dismissedAt: new Date(),
      },
      create: {
        transactionId,
        plannedTransactionId,
      },
    });
  }

  /**
   * Manually link a transaction to a planned transaction
   * @param transactionId - Transaction UUID
   * @param plannedTransactionId - Planned transaction ID
   * @param userId - User UUID
   */
  async manualMatch(
    transactionId: string,
    plannedTransactionId: string,
    userId: string
  ): Promise<{ id: string }> {
    return this.confirmMatch(
      transactionId,
      plannedTransactionId,
      100, // Manual matches are 100% confidence
      MatchMethod.MANUAL,
      userId
    );
  }

  /**
   * Get match history
   * @param userId - User UUID
   * @param startDate - Start date filter
   * @param endDate - End date filter
   * @param limit - Maximum number of records
   * @param offset - Offset for pagination
   */
  async getMatchHistory(
    userId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: MatchHistoryItem[]; total: number }> {
    const where: Prisma.MatchedTransactionWhereInput = {
      transaction: {
        userId,
      },
    };

    if (startDate || endDate) {
      where.matchedAt = {};
      if (startDate) where.matchedAt.gte = new Date(startDate);
      if (endDate) where.matchedAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.matchedTransaction.findMany({
        where,
        include: {
          transaction: {
            include: {
              account: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { matchedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.matchedTransaction.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        transactionId: item.transactionId,
        transaction: {
          id: item.transaction.id,
          description: item.transaction.description,
          amount: Number(item.transaction.amount),
          date: item.transaction.date,
          accountId: item.transaction.accountId,
          accountName: item.transaction.account.name,
        },
        plannedTemplateId: item.plannedTemplateId,
        plannedExpectedDate: item.plannedExpectedDate,
        plannedAmount: Number(item.plannedAmount),
        matchConfidence: Number(item.matchConfidence),
        matchedAt: item.matchedAt,
        matchMethod: item.matchMethod,
      })),
      total,
    };
  }

  /**
   * Unmatch a transaction (undo a match)
   * @param matchId - Match record UUID
   * @param userId - User UUID
   */
  async unmatch(matchId: string, userId: string): Promise<void> {
    const match = await this.prisma.matchedTransaction.findFirst({
      where: {
        id: matchId,
        transaction: {
          userId,
        },
      },
    });

    if (!match) {
      throw new AppError('Match record not found', 404);
    }

    await this.prisma.matchedTransaction.delete({
      where: { id: matchId },
    });
  }

  /**
   * Batch auto-match for multiple transactions
   * @param transactionIds - Array of transaction UUIDs
   * @param userId - User UUID
   * @returns Summary of match results
   */
  async batchAutoMatch(
    transactionIds: string[],
    userId: string
  ): Promise<{
    matched: number;
    unmatched: number;
    results: Array<{
      transactionId: string;
      matched: boolean;
      matchId?: string;
      confidence?: number;
    }>;
  }> {
    const results: Array<{
      transactionId: string;
      matched: boolean;
      matchId?: string;
      confidence?: number;
    }> = [];

    let matched = 0;
    let unmatched = 0;

    for (const transactionId of transactionIds) {
      try {
        const result = await this.autoMatch(transactionId, userId);
        if (result?.matched) {
          matched++;
          results.push({
            transactionId,
            matched: true,
            matchId: result.matchId,
            confidence: result.confidence,
          });
        } else {
          unmatched++;
          results.push({ transactionId, matched: false });
        }
      } catch {
        unmatched++;
        results.push({ transactionId, matched: false });
      }
    }

    return { matched, unmatched, results };
  }
}
