/**
 * Analytics Type Definitions
 * Frontend types matching backend API responses
 */

// Daily Balances
export interface AccountDailyBalance {
  accountId: string;
  accountName: string;
  balance: number;
  transactions: {
    id: string;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  }[];
}

export interface DailyBalance {
  date: string; // YYYY-MM-DD
  balance: number;
  accounts: AccountDailyBalance[];
}

export interface DailyBalancesResponse {
  dailyBalances: DailyBalance[];
}

// Category Totals
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

// Spending Trends
export interface SpendingTrend {
  period: string; // Format depends on groupBy: YYYY-MM-DD, YYYY-WXX, or YYYY-MM
  income: number;
  expense: number;
  net: number;
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

// Query Parameters
export type GroupByPeriod = 'day' | 'week' | 'month';
export type TransactionTypeFilter = 'INCOME' | 'EXPENSE' | 'ALL';

export interface DailyBalancesParams {
  startDate: string; // YYYY-MM-DD or ISO datetime
  endDate: string;
  accountIds?: string[]; // Optional array of account IDs
}

export interface CategoryTotalsParams {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  type?: TransactionTypeFilter;
  includeSubcategories?: boolean;
}

export interface SpendingTrendsParams {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  categoryIds?: string[];
  groupBy?: GroupByPeriod;
}

export interface IncomeVsExpenseParams {
  startDate: string;
  endDate: string;
  accountIds?: string[];
  categoryIds?: string[];
  groupBy?: GroupByPeriod;
}
