/**
 * Potential Transfer Types
 * TypeScript types for potential transfer detection and review
 */

// ============================================================================
// Potential Transfer Types
// ============================================================================

export interface PotentialTransferTransaction {
  id: string;
  description: string;
  merchant: string | null;
  amount: number;
  date: string;
  accountName: string;
}

export interface PotentialTransfer {
  id: string;
  userId: string;
  sourceTransactionId: string;
  targetTransactionId: string;
  confidence: number;
  status: string;
  detectedAt: string;
  sourceAccountId: string;
  sourceAccountName: string;
  targetAccountId: string;
  targetAccountName: string;
  amount: number;
  date: string;
  sourceTransaction: PotentialTransferTransaction;
  targetTransaction: PotentialTransferTransaction;
}

// ============================================================================
// Request Types
// ============================================================================

export interface DetectTransfersQuery {
  daysBack?: number;
}

export interface DetectTransfersResult {
  detected: number;
}

export interface ConfirmTransferResult {
  transferId: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface PendingCountResult {
  count: number;
}
