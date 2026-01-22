/**
 * Forecast TypeScript type definitions for frontend
 */

import { TransactionType } from './index';
import { ImplicitSpendMode } from './plannedTransaction.types';

// ============================================================================
// Forecast Types
// ============================================================================

export interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
}

export interface PlannedTransactionSummary {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  isVirtual: boolean;
}

export interface ImplicitSpendSummary {
  budgetId: string;
  budgetName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  mode: ImplicitSpendMode;
}

export interface DailyForecast {
  date: string;
  accountBalances: {
    accountId: string;
    accountName: string;
    openingBalance: number;
    closingBalance: number;
  }[];
  totalBalance: number;
  plannedTransactions: PlannedTransactionSummary[];
  implicitSpend: ImplicitSpendSummary[];
  hasLowBalance: boolean;
}

export interface ForecastSummary {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netChange: number;
  lowestBalance: number;
  lowestBalanceDate: string;
  lowestBalanceAccount: string;
}

export interface ForecastResponse {
  startDate: string;
  endDate: string;
  accountIds: string[] | null;
  currentBalances: AccountBalance[];
  dailyForecasts: DailyForecast[];
  summary: ForecastSummary;
}

export interface ForecastSummaryResponse extends ForecastSummary {
  startDate: string;
  endDate: string;
}

export interface LowBalanceWarning {
  date: string;
  accountId: string;
  accountName: string;
  projectedBalance: number;
  threshold: number;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface ForecastQuery {
  startDate?: string;
  endDate?: string;
  days?: number;
  accountIds?: string;
}

export interface LowBalanceWarningQuery {
  threshold?: number;
  days?: number;
}
