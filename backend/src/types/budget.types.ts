/**
 * Budget-related TypeScript type definitions
 * These types are used across the backend for budget management
 */

export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'ANNUALLY';

export type BudgetType = 'INCOME' | 'EXPENSE';

export type BudgetStatus = 'UNDER_BUDGET' | 'ON_TRACK' | 'WARNING' | 'EXCEEDED';

/**
 * Budget with calculated status and spending information
 */
export interface BudgetWithStatus {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  type: BudgetType; // Budget type: income vs expense

  // Period definition (NULL for one-time budgets)
  periodType: BudgetPeriod | null;
  interval: number | null;
  startDate: string;
  endDate: string | null;

  includeSubcategories: boolean;
  name?: string;
  notes?: string;

  // Template linkage
  templateId?: string | null;
  isCustomized?: boolean;

  createdAt: string;
  updatedAt: string;

  // Calculated fields
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  isComplete?: boolean; // NEW: true when one-time budget is fully spent
}

/**
 * Budget summary response for dashboard
 */
export interface BudgetSummaryResponse {
  budgets: BudgetWithStatus[];
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
}

/**
 * Query parameters for filtering budgets
 */
export interface BudgetQuery {
  categoryId?: string;
  templateId?: string;

  // NEW: Filter by date range
  startDate?: string; // ISO datetime
  endDate?: string; // ISO datetime

  // NEW: Filter one-time vs recurring
  isRecurring?: boolean; // true = has periodType, false = no periodType

  includeStatus?: boolean;
}

/**
 * Budget template with calculated stats
 */
export interface BudgetTemplateWithStats {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  type: BudgetType; // Budget type: income vs expense
  periodType: BudgetPeriod;
  interval: number;
  includeSubcategories: boolean;
  firstStartDate: string;
  endDate: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Stats
  totalInstances: number;
  activeInstances: number;
  nextPeriodStart: string | null; // ISO datetime of next period start
}

/**
 * Update scope for budget instance modifications
 */
export type UpdateScope = 'THIS_ONLY' | 'THIS_AND_FUTURE' | 'ALL';

/**
 * Historical comparison types
 */
export type HistoricalComparisonType = 'previous' | 'trend' | 'yoy';

/**
 * Category budget summary for historical comparison
 */
export interface CategoryBudgetSummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgeted: number;
  spent: number;
  percentage: number;
  status: BudgetStatus;
}

/**
 * Period summary for trend data
 */
export interface TrendPeriod {
  period: string; // e.g., "January 2026", "Week 3 2026"
  startDate: string;
  endDate: string;
  totalBudgeted: number;
  totalSpent: number;
  percentage: number;
  status: BudgetStatus;
}

/**
 * Historical comparison response
 */
export interface BudgetHistoricalResponse {
  type: HistoricalComparisonType;
  current: {
    period: string;
    startDate: string;
    endDate: string;
    totalBudgeted: number;
    totalSpent: number;
    percentage: number;
    status: BudgetStatus;
    categories: CategoryBudgetSummary[];
  };
  comparison: {
    period: string;
    startDate: string;
    endDate: string;
    totalBudgeted: number;
    totalSpent: number;
    percentage: number;
    budgetedChange: number; // percentage change from comparison period
    spentChange: number; // percentage change from comparison period
  } | null;
  trend?: TrendPeriod[];
}
