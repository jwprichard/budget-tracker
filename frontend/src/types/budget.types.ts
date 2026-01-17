/**
 * Budget-related TypeScript type definitions for frontend
 * Matches backend types for consistency
 */

export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'ANNUALLY';

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

  // Period definition (NULL for one-time budgets)
  periodType: BudgetPeriod | null;
  interval: number | null;
  startDate: string;
  endDate: string | null;

  includeSubcategories: boolean;
  name?: string;
  notes?: string;
  templateId?: string | null; // Link to template if this is an instance
  isCustomized?: boolean; // Track if manually edited
  createdAt: string;
  updatedAt: string;

  // Calculated fields
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  isComplete?: boolean; // true when one-time budget is fully spent
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
  templateId?: string; // Filter budgets by template

  // NEW: Filter by date range
  startDate?: string; // ISO datetime
  endDate?: string; // ISO datetime

  // NEW: Filter one-time vs recurring
  isRecurring?: boolean; // true = has periodType, false = no periodType

  includeStatus?: boolean;
}

/**
 * Create budget DTO
 */
export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  includeSubcategories?: boolean;
  name?: string;
  notes?: string;

  // Required
  startDate: string; // ISO datetime

  // Optional - both must be present or both absent (recurring vs one-time)
  periodType?: BudgetPeriod;
  interval?: number;
}

/**
 * Update budget DTO
 */
export interface UpdateBudgetDto {
  amount?: number;
  includeSubcategories?: boolean;
  name?: string | null;
  notes?: string | null;
}

/**
 * Budget from API (without status)
 */
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;

  // Period definition (NULL for one-time budgets)
  periodType: BudgetPeriod | null;
  interval: number | null;
  startDate: string;
  endDate: string | null;

  includeSubcategories: boolean;
  name: string | null;
  notes: string | null;
  templateId?: string | null; // Link to template if this is an instance
  isCustomized?: boolean; // Track if manually edited
  createdAt: string;
  updatedAt: string;
}

/**
 * Budget template with calculated statistics
 */
export interface BudgetTemplate {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  periodType: BudgetPeriod;
  interval: number;
  includeSubcategories: boolean;
  firstStartDate: string; // ISO datetime of first period start
  endDate: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Calculated statistics
  totalInstances: number;
  activeInstances: number;
  nextPeriodStart: string | null; // ISO datetime of next period start
}

/**
 * Create budget template DTO
 */
export interface CreateBudgetTemplateDto {
  categoryId: string;
  amount: number;
  periodType: BudgetPeriod;
  interval: number;
  firstStartDate: string; // ISO datetime
  endDate?: string; // ISO datetime string, optional
  includeSubcategories?: boolean;
  name: string; // Required for templates
  notes?: string;
}

/**
 * Update budget template DTO
 */
export interface UpdateBudgetTemplateDto {
  amount?: number;
  interval?: number;
  includeSubcategories?: boolean;
  endDate?: string | null;
  isActive?: boolean;
  name?: string;
  notes?: string | null;
}

/**
 * Update scope for budget instance modifications
 */
export type UpdateScope = 'THIS_ONLY' | 'THIS_AND_FUTURE' | 'ALL';

/**
 * Update budget instance with scope DTO
 */
export interface UpdateBudgetInstanceDto {
  amount?: number;
  includeSubcategories?: boolean;
  name?: string | null;
  notes?: string | null;
  scope: UpdateScope;
}
