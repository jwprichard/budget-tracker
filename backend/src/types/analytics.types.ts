/**
 * Analytics Types
 * Type definitions for analytics endpoints and data structures
 */

export interface DailyBalance {
  date: string; // YYYY-MM-DD
  balance: number;
  accounts: AccountDailyBalance[];
}

export interface AccountDailyBalance {
  accountId: string;
  accountName: string;
  balance: number;
  transactions: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  amount: number;
  description: string;
  type: string;
}

export interface DailyBalancesResponse {
  dailyBalances: DailyBalance[];
}

export interface CategoryTotal {
  categoryId: string | null;
  categoryName: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  color: string;
  total: number;
  percentage: number;
  transactionCount: number;
  subcategories?: CategoryTotal[];
}

export interface CategoryTotalsResponse {
  categories: CategoryTotal[];
  totalAmount: number;
  uncategorizedAmount: number;
}

export interface SpendingTrend {
  period: string; // Date or period label
  income: number;
  expense: number; // Absolute value (positive)
  net: number; // income - expense
  transactionCount: number;
}

export interface SpendingTrendsResponse {
  trends: SpendingTrend[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    netChange: number;
    averageDaily: number;
  };
}

export interface IncomeVsExpenseResponse extends SpendingTrendsResponse {}

export type GroupByPeriod = 'day' | 'week' | 'month';
export type TransactionTypeFilter = 'INCOME' | 'EXPENSE' | 'ALL';

export interface AnalyticsQueryOptions {
  startDate: Date;
  endDate: Date;
  accountIds?: string[];
  categoryIds?: string[];
  groupBy?: GroupByPeriod;
  type?: TransactionTypeFilter;
  includeSubcategories?: boolean;
}
