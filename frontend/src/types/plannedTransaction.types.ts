/**
 * Planned Transaction TypeScript type definitions for frontend
 */

import { TransactionType } from './index';

// ============================================================================
// Enums
// ============================================================================

export type DayOfMonthType =
  | 'FIXED'
  | 'LAST_DAY'
  | 'FIRST_WEEKDAY'
  | 'LAST_WEEKDAY'
  | 'FIRST_OF_WEEK'
  | 'LAST_OF_WEEK';

export type ImplicitSpendMode = 'DAILY' | 'END_OF_PERIOD' | 'NONE';

export type MatchMethod = 'AUTO' | 'AUTO_REVIEWED' | 'MANUAL';

export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'ANNUALLY';

// ============================================================================
// Planned Transaction Template
// ============================================================================

export interface PlannedTransactionTemplate {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  isTransfer: boolean;
  transferToAccountId: string | null;
  transferToAccountName: string | null;
  amount: number;
  type: TransactionType;
  name: string;
  description: string | null;
  notes: string | null;
  periodType: BudgetPeriod;
  interval: number;
  firstOccurrence: string;
  endDate: string | null;
  dayOfMonth: number | null;
  dayOfMonthType: DayOfMonthType | null;
  dayOfWeek: number | null;
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | null;
  matchWindowDays: number;
  budgetId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  nextOccurrence: string | null;
  totalOverrides: number;
}

export interface CreatePlannedTransactionTemplateDto {
  accountId: string;
  categoryId?: string;
  isTransfer?: boolean;
  transferToAccountId?: string;
  amount: number;
  type: TransactionType;
  name: string;
  description?: string;
  notes?: string;
  periodType: BudgetPeriod;
  interval?: number;
  firstOccurrence: string;
  endDate?: string;
  dayOfMonth?: number;
  dayOfMonthType?: DayOfMonthType;
  dayOfWeek?: number;
  autoMatchEnabled?: boolean;
  skipReview?: boolean;
  matchTolerance?: number;
  matchWindowDays?: number;
  budgetId?: string;
}

export interface UpdatePlannedTransactionTemplateDto {
  accountId?: string;
  categoryId?: string | null;
  isTransfer?: boolean;
  transferToAccountId?: string | null;
  amount?: number;
  type?: TransactionType;
  name?: string;
  description?: string | null;
  notes?: string | null;
  interval?: number;
  firstOccurrence?: string;
  endDate?: string | null;
  dayOfMonth?: number | null;
  dayOfMonthType?: DayOfMonthType | null;
  dayOfWeek?: number | null;
  autoMatchEnabled?: boolean;
  skipReview?: boolean;
  matchTolerance?: number | null;
  matchWindowDays?: number;
  budgetId?: string | null;
  isActive?: boolean;
}

// ============================================================================
// Planned Transaction (One-time & Overrides)
// ============================================================================

export interface PlannedTransaction {
  id: string;
  userId: string;
  templateId: string | null;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  isTransfer: boolean;
  transferToAccountId: string | null;
  transferToAccountName: string | null;
  amount: number;
  type: TransactionType;
  name: string;
  description: string | null;
  notes: string | null;
  expectedDate: string;
  isOverride: boolean;
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | null;
  matchWindowDays: number;
  budgetId: string | null;
  createdAt: string;
  updatedAt: string;
  isVirtual: boolean;
}

export interface CreatePlannedTransactionDto {
  templateId?: string;
  accountId: string;
  categoryId?: string;
  isTransfer?: boolean;
  transferToAccountId?: string;
  amount: number;
  type: TransactionType;
  name: string;
  description?: string;
  notes?: string;
  expectedDate: string;
  isOverride?: boolean;
  autoMatchEnabled?: boolean;
  skipReview?: boolean;
  matchTolerance?: number;
  matchWindowDays?: number;
  budgetId?: string;
}

export interface UpdatePlannedTransactionDto {
  accountId?: string;
  categoryId?: string | null;
  isTransfer?: boolean;
  transferToAccountId?: string | null;
  amount?: number;
  type?: TransactionType;
  name?: string;
  description?: string | null;
  notes?: string | null;
  expectedDate?: string;
  autoMatchEnabled?: boolean;
  skipReview?: boolean;
  matchTolerance?: number | null;
  matchWindowDays?: number;
  budgetId?: string | null;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface PlannedTransactionTemplateQuery {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  isActive?: boolean;
  budgetId?: string;
}

export interface PlannedTransactionQuery {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  templateId?: string;
  includeVirtual?: boolean;
}

export interface TemplateOccurrencesQuery {
  startDate: string;
  endDate: string;
}
