/**
 * Virtual Planned Transaction Generation Utilities
 * Functions for calculating planned transaction occurrences on-the-fly from templates
 */

import { TransactionType, BudgetPeriod, DayOfMonthType } from '@prisma/client';
import { calculateNextPeriodStart } from './periodCalculations';

/**
 * Represents a virtual planned transaction calculated from a template
 */
export interface VirtualPlannedTransaction {
  // Composite ID for virtual occurrences: "virtual_{templateId}_{expectedDateISO}"
  id: string;
  templateId: string;
  userId: string;

  // Transaction details
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;

  // Transfer details
  isTransfer: boolean;
  transferToAccountId: string | null;
  transferToAccountName: string | null;

  // Amount and type
  amount: number;
  type: TransactionType;

  // Description
  name: string;
  description: string | null;
  notes: string | null;

  // Timing
  expectedDate: Date;

  // Matching config
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | null;
  matchWindowDays: number;

  // Budget linkage
  budgetId: string | null;

  // Flags
  isVirtual: true;
  isOverride: false;
}

/**
 * Template with related data for occurrence generation
 */
export interface TemplateWithRelations {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  isTransfer: boolean;
  transferToAccountId: string | null;
  amount: number | { toNumber: () => number };
  type: TransactionType;
  name: string;
  description: string | null;
  notes: string | null;
  periodType: BudgetPeriod;
  interval: number;
  firstOccurrence: Date;
  endDate: Date | null;
  dayOfMonth: number | null;
  dayOfMonthType: DayOfMonthType | null;
  dayOfWeek: number | null;
  autoMatchEnabled: boolean;
  skipReview: boolean;
  matchTolerance: number | { toNumber: () => number } | null;
  matchWindowDays: number;
  budgetId: string | null;
  isActive: boolean;
  account?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  transferToAccount?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Generate a unique ID for a virtual planned transaction
 * Format: "virtual_{templateId}_{expectedDate as ISO string}"
 */
export function getVirtualPlannedTransactionId(templateId: string, expectedDate: Date): string {
  return `virtual_${templateId}_${expectedDate.toISOString()}`;
}

/**
 * Parse a virtual planned transaction ID to extract templateId and expectedDate
 * Returns null if not a valid virtual ID
 */
export function parseVirtualPlannedTransactionId(id: string): { templateId: string; expectedDate: Date } | null {
  if (!id.startsWith('virtual_')) {
    return null;
  }

  const parts = id.split('_');
  if (parts.length < 3) {
    return null;
  }

  const templateId = parts[1];
  if (!templateId) {
    return null;
  }

  const expectedDateStr = parts.slice(2).join('_'); // Handle ISO date with colons

  try {
    const expectedDate = new Date(expectedDateStr);
    if (isNaN(expectedDate.getTime())) {
      return null;
    }
    return { templateId, expectedDate };
  } catch {
    return null;
  }
}

/**
 * Check if an ID represents a virtual planned transaction
 */
export function isVirtualPlannedTransactionId(id: string): boolean {
  return id.startsWith('virtual_');
}

/**
 * Get the amount as a number from a template
 */
function getAmount(value: number | { toNumber: () => number } | null): number | null {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

/**
 * Calculate the expected date for an occurrence based on day-of-month settings
 */
function calculateExpectedDate(
  baseDate: Date,
  periodType: BudgetPeriod,
  dayOfMonth: number | null,
  dayOfMonthType: DayOfMonthType | null,
  dayOfWeek: number | null
): Date {
  // For non-monthly periods, just return the base date
  if (periodType !== 'MONTHLY' && periodType !== 'ANNUALLY') {
    return baseDate;
  }

  const result = new Date(baseDate);

  if (dayOfMonthType === null || dayOfMonthType === 'FIXED') {
    // Use specific day of month
    if (dayOfMonth !== null && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(dayOfMonth, lastDayOfMonth));
    }
    return result;
  }

  const year = result.getFullYear();
  const month = result.getMonth();

  switch (dayOfMonthType) {
    case 'LAST_DAY': {
      // Last day of month
      result.setMonth(month + 1, 0);
      break;
    }

    case 'FIRST_WEEKDAY': {
      // First Monday-Friday of month
      result.setDate(1);
      while (result.getDay() === 0 || result.getDay() === 6) {
        result.setDate(result.getDate() + 1);
      }
      break;
    }

    case 'LAST_WEEKDAY': {
      // Last Monday-Friday of month
      result.setMonth(month + 1, 0); // Last day of month
      while (result.getDay() === 0 || result.getDay() === 6) {
        result.setDate(result.getDate() - 1);
      }
      break;
    }

    case 'FIRST_OF_WEEK': {
      // First occurrence of specific weekday in month
      if (dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6) {
        result.setDate(1);
        while (result.getDay() !== dayOfWeek) {
          result.setDate(result.getDate() + 1);
        }
      }
      break;
    }

    case 'LAST_OF_WEEK': {
      // Last occurrence of specific weekday in month
      if (dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6) {
        result.setMonth(month + 1, 0); // Last day of month
        while (result.getDay() !== dayOfWeek) {
          result.setDate(result.getDate() - 1);
        }
      }
      break;
    }
  }

  return result;
}

/**
 * Generate virtual occurrences for a template within a date range
 *
 * @param template - The planned transaction template
 * @param rangeStart - Start of the date range (inclusive)
 * @param rangeEnd - End of the date range (inclusive)
 * @returns Array of virtual planned transactions that fall within the range
 */
export function generateVirtualPlannedTransactions(
  template: TemplateWithRelations,
  rangeStart: Date,
  rangeEnd: Date
): VirtualPlannedTransaction[] {
  const occurrences: VirtualPlannedTransaction[] = [];

  // Only generate for active templates
  if (!template.isActive) {
    return occurrences;
  }

  // Start from the template's first occurrence
  let currentPeriodStart = new Date(template.firstOccurrence);

  // If the template hasn't started yet, check if its first occurrence falls in range
  if (currentPeriodStart > rangeEnd) {
    return occurrences;
  }

  // Walk through occurrences until we're past the range end or template end
  const maxIterations = 1000; // Safety limit
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Calculate the expected date for this occurrence
    const expectedDate = calculateExpectedDate(
      currentPeriodStart,
      template.periodType,
      template.dayOfMonth,
      template.dayOfMonthType,
      template.dayOfWeek
    );

    // Check if this occurrence falls within the requested range
    if (expectedDate >= rangeStart && expectedDate <= rangeEnd) {
      // Check template end date
      if (template.endDate && expectedDate > template.endDate) {
        break;
      }

      const amount = getAmount(template.amount) ?? 0;
      const matchTolerance = getAmount(template.matchTolerance);

      occurrences.push({
        id: getVirtualPlannedTransactionId(template.id, expectedDate),
        templateId: template.id,
        userId: template.userId,
        accountId: template.accountId,
        accountName: template.account?.name ?? '',
        categoryId: template.categoryId,
        categoryName: template.category?.name ?? null,
        categoryColor: template.category?.color ?? null,
        isTransfer: template.isTransfer,
        transferToAccountId: template.transferToAccountId,
        transferToAccountName: template.transferToAccount?.name ?? null,
        amount,
        type: template.type,
        name: template.name,
        description: template.description,
        notes: template.notes,
        expectedDate: new Date(expectedDate),
        autoMatchEnabled: template.autoMatchEnabled,
        skipReview: template.skipReview,
        matchTolerance,
        matchWindowDays: template.matchWindowDays,
        budgetId: template.budgetId,
        isVirtual: true,
        isOverride: false,
      });
    }

    // Move to next period
    const nextPeriodStart = calculateNextPeriodStart(
      currentPeriodStart,
      template.periodType,
      template.interval
    );

    // Safety check - ensure we're moving forward
    if (nextPeriodStart <= currentPeriodStart) {
      break;
    }

    currentPeriodStart = nextPeriodStart;

    // Stop if we've passed the range end
    if (currentPeriodStart > rangeEnd) {
      break;
    }

    // Stop if we've passed the template's end date
    if (template.endDate && currentPeriodStart > template.endDate) {
      break;
    }
  }

  return occurrences;
}

/**
 * Find the occurrence that contains or is closest to a specific date for a template
 *
 * @param template - The planned transaction template
 * @param targetDate - The date to find an occurrence for
 * @returns The virtual planned transaction closest to the date, or null if none
 */
export function findOccurrenceForDate(
  template: TemplateWithRelations,
  targetDate: Date
): VirtualPlannedTransaction | null {
  // Generate occurrences around the target date
  const rangeStart = new Date(targetDate);
  rangeStart.setDate(rangeStart.getDate() - 45); // 45 days before
  const rangeEnd = new Date(targetDate);
  rangeEnd.setDate(rangeEnd.getDate() + 45); // 45 days after

  const occurrences = generateVirtualPlannedTransactions(template, rangeStart, rangeEnd);

  if (occurrences.length === 0) {
    return null;
  }

  // Find the occurrence with expectedDate matching the target
  const exactMatch = occurrences.find(
    (o) => o.expectedDate.toISOString() === targetDate.toISOString()
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Find the closest occurrence
  let closest = occurrences[0];
  let minDiff = Math.abs(occurrences[0].expectedDate.getTime() - targetDate.getTime());

  for (const occurrence of occurrences) {
    const diff = Math.abs(occurrence.expectedDate.getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = occurrence;
    }
  }

  return closest;
}

/**
 * Get the next upcoming occurrence for a template (the one after "now")
 */
export function getNextOccurrence(template: TemplateWithRelations): VirtualPlannedTransaction | null {
  const now = new Date();
  const rangeEnd = new Date();
  rangeEnd.setFullYear(rangeEnd.getFullYear() + 1); // Look ahead 1 year

  const occurrences = generateVirtualPlannedTransactions(template, now, rangeEnd);

  // Return the first occurrence that's in the future
  return occurrences.find((o) => o.expectedDate > now) ?? null;
}

/**
 * Generate a limited number of future occurrences from a template
 *
 * @param template - The planned transaction template
 * @param count - Number of occurrences to generate
 * @param fromDate - Start generating from this date (default: now)
 * @returns Array of virtual planned transactions
 */
export function generateFutureOccurrences(
  template: TemplateWithRelations,
  count: number,
  fromDate: Date = new Date()
): VirtualPlannedTransaction[] {
  // Generate a wide range and take the first 'count'
  const rangeEnd = new Date(fromDate);
  rangeEnd.setFullYear(rangeEnd.getFullYear() + 5); // Look ahead 5 years max

  const allOccurrences = generateVirtualPlannedTransactions(template, fromDate, rangeEnd);

  return allOccurrences.slice(0, count);
}
