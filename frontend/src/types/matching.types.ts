/**
 * Matching Types
 * TypeScript types for transaction matching
 */

// ============================================================================
// Enums
// ============================================================================

export enum MatchMethod {
  AUTO = 'AUTO',
  AUTO_REVIEWED = 'AUTO_REVIEWED',
  MANUAL = 'MANUAL',
}

// ============================================================================
// Pending Match Types
// ============================================================================

export interface PendingMatchTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  account: {
    id: string;
    name: string;
    type: string;
  };
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface PendingMatchPlannedTransaction {
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
}

export interface PendingMatch {
  id: string;
  transactionId: string;
  plannedTransactionId: string;
  transaction: PendingMatchTransaction;
  plannedTransaction: PendingMatchPlannedTransaction;
  confidence: number;
  reasons: string[];
  suggestedAt: string;
}

// ============================================================================
// Match History Types
// ============================================================================

export interface MatchHistoryTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  accountId: string;
  accountName: string;
}

export interface MatchHistoryItem {
  id: string;
  transactionId: string;
  transaction: MatchHistoryTransaction;
  plannedTemplateId: string | null;
  plannedExpectedDate: string;
  plannedAmount: number;
  matchConfidence: number;
  matchedAt: string;
  matchMethod: MatchMethod;
}

export interface MatchHistoryResponse {
  items: MatchHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ============================================================================
// Auto-Match Types
// ============================================================================

export interface AutoMatchResult {
  matched: boolean;
  matchId?: string;
  confidence?: number;
}

export interface BatchAutoMatchResult {
  matched: number;
  unmatched: number;
  results: Array<{
    transactionId: string;
    matched: boolean;
    matchId?: string;
    confidence?: number;
  }>;
}

// ============================================================================
// Query Types
// ============================================================================

export interface PendingMatchesQuery {
  limit?: number;
}

export interface MatchHistoryQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Request Types
// ============================================================================

export interface ConfirmMatchRequest {
  transactionId: string;
  plannedTransactionId: string;
}

export interface DismissMatchRequest {
  transactionId: string;
  plannedTransactionId: string;
}

export interface ManualMatchRequest {
  transactionId: string;
  plannedTransactionId: string;
}

export interface AutoMatchRequest {
  transactionId: string;
}

export interface BatchAutoMatchRequest {
  transactionIds: string[];
}
