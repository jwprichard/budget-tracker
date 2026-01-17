/**
 * Budget-related TypeScript type definitions for frontend
 * Matches backend types for consistency
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
  templateId?: string | null; // Link to template if this is an instance
  isCustomized?: boolean; // Track if manually edited
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
  templateId?: string; // Filter budgets by template
}

/**
 * Create budget DTO
 */
export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
  periodType: BudgetPeriod;
  periodYear: number;
  periodNumber: number;
  includeSubcategories?: boolean;
  name?: string;
  notes?: string;
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
  periodType: BudgetPeriod;
  periodYear: number;
  periodNumber: number;
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
  includeSubcategories: boolean;
  startYear: number;
  startNumber: number;
  endDate: string | null;
  isActive: boolean;
  name: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Calculated statistics
  totalInstances: number;
  activeInstances: number;
  nextPeriod: { year: number; periodNumber: number } | null;
}

/**
 * Create budget template DTO
 */
export interface CreateBudgetTemplateDto {
  categoryId: string;
  amount: number;
  periodType: BudgetPeriod;
  startYear: number;
  startNumber: number;
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
