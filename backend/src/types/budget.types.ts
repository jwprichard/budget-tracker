/**
 * Budget-related TypeScript type definitions
 * These types are used across the backend for budget management
 */

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

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
  periodType: BudgetPeriod;
  periodYear: number;
  periodNumber: number;
  includeSubcategories: boolean;
  name?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Calculated fields
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  startDate: string;
  endDate: string;
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
  periodType?: BudgetPeriod;
  periodYear?: number;
  periodNumber?: number;
  includeStatus?: boolean;
  templateId?: string;
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
  periodType: BudgetPeriod;
  includeSubcategories: boolean;
  startYear: number;
  startNumber: number;
  endDate: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Stats
  totalInstances: number;
  activeInstances: number;
  nextPeriod: { year: number; periodNumber: number } | null;
}

/**
 * Update scope for budget instance modifications
 */
export type UpdateScope = 'THIS_ONLY' | 'THIS_AND_FUTURE' | 'ALL';
