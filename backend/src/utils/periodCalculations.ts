/**
 * Period Calculation Utilities
 * Functions for calculating budget period boundaries based on custom start dates and intervals
 */

import { BudgetPeriod } from '@prisma/client';

/**
 * Calculate end date for a budget period
 * @param startDate - Period start date
 * @param periodType - Type of period (DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ANNUALLY)
 * @param interval - Multiplier (e.g., 2 = every 2 periods)
 * @returns End date (exclusive) or null for one-time budgets
 */
export function calculatePeriodEndDate(
  startDate: Date,
  periodType: BudgetPeriod | null,
  interval: number | null
): Date | null {
  if (!periodType || !interval) {
    // One-time budget - no end date
    return null;
  }

  switch (periodType) {
    case 'DAILY':
      return addDays(startDate, interval);

    case 'WEEKLY':
      return addDays(startDate, interval * 7);

    case 'FORTNIGHTLY':
      return addDays(startDate, interval * 14);

    case 'MONTHLY':
      return calculateMonthlyEndDate(startDate, interval);

    case 'ANNUALLY':
      return addYears(startDate, interval);

    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Calculate end date for monthly periods with day-reset logic
 * Preserves original day-of-month when possible, resets to it when month allows
 *
 * Example: Start Jan 31
 * - Period 1: Jan 31 - Feb 28 (Feb has no 31st)
 * - Period 2: Feb 28 - Mar 31 (resets to 31st)
 * - Period 3: Mar 31 - Apr 30 (April has no 31st)
 */
function calculateMonthlyEndDate(startDate: Date, intervalMonths: number): Date {
  const originalDay = startDate.getDate();

  // Calculate target month
  let endMonth = startDate.getMonth() + intervalMonths;
  let endYear = startDate.getFullYear();

  // Handle month overflow (e.g., month 14 = year+1, month 2)
  while (endMonth >= 12) {
    endMonth -= 12;
    endYear += 1;
  }
  while (endMonth < 0) {
    endMonth += 12;
    endYear -= 1;
  }

  // Get number of days in the target month
  const daysInEndMonth = getDaysInMonth(endYear, endMonth);

  // Use original day if possible, otherwise last day of month
  const targetDay = Math.min(originalDay, daysInEndMonth);

  // Create end date
  const endDate = new Date(endYear, endMonth, targetDay);

  return endDate;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add years to a date
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  // month is 0-indexed (0 = January, 11 = December)
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculate the next period start date from a given date
 * Used for generating recurring budget instances
 *
 * @param currentStart - Current period start date
 * @param periodType - Type of period
 * @param interval - Multiplier
 * @returns Next period start date
 */
export function calculateNextPeriodStart(
  currentStart: Date,
  periodType: BudgetPeriod,
  interval: number
): Date {
  // For most periods, next start = current end
  const endDate = calculatePeriodEndDate(currentStart, periodType, interval);

  if (!endDate) {
    throw new Error('Cannot calculate next period for one-time budget');
  }

  return endDate;
}

/**
 * Check if a date falls within a budget period
 *
 * @param date - Date to check
 * @param budgetStart - Budget period start date
 * @param budgetEnd - Budget period end date (null for one-time budgets)
 * @returns True if date is within the period
 */
export function isDateInBudgetPeriod(
  date: Date,
  budgetStart: Date,
  budgetEnd: Date | null
): boolean {
  if (!budgetEnd) {
    // One-time budget - always active from start date onward
    return date >= budgetStart;
  }

  // Check if date is in range [start, end)
  return date >= budgetStart && date < budgetEnd;
}

/**
 * Format period display string
 *
 * @param startDate - Period start date
 * @param periodType - Type of period (null for one-time)
 * @returns Formatted string like "Starting Jan 15, 2026"
 */
export function formatBudgetPeriod(
  startDate: Date,
  periodType: BudgetPeriod | null
): string {
  const dateStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `Starting ${dateStr}`;
}

/**
 * Get period type display name
 *
 * @param periodType - Type of period
 * @param interval - Multiplier
 * @returns Human-readable label like "2 weeks" or "1 month"
 */
export function getPeriodLabel(periodType: BudgetPeriod, interval: number): string {
  const labels: Record<BudgetPeriod, [string, string]> = {
    DAILY: ['day', 'days'],
    WEEKLY: ['week', 'weeks'],
    FORTNIGHTLY: ['fortnight', 'fortnights'],
    MONTHLY: ['month', 'months'],
    ANNUALLY: ['year', 'years'],
  };

  const [singular, plural] = labels[periodType];
  return interval === 1 ? singular : plural;
}

/**
 * Check if a date is in the future relative to another date
 */
export function isFutureDate(date: Date, relativeTo: Date = new Date()): boolean {
  return date > relativeTo;
}

/**
 * Check if a date is in the past relative to another date
 */
export function isPastDate(date: Date, relativeTo: Date = new Date()): boolean {
  return date < relativeTo;
}

/**
 * Get period boundaries for transaction filtering
 * Returns the start and end dates for a budget period
 *
 * @param startDate - Budget start date
 * @param endDate - Budget end date (null for one-time)
 * @returns Object with startDate and endDate
 */
export function getPeriodBoundaries(
  startDate: Date,
  endDate: Date | null
): { startDate: Date; endDate: Date | null } {
  return {
    startDate,
    endDate,
  };
}

/**
 * Validate interval value
 * @param interval - Interval to validate
 * @param periodType - Period type
 * @throws Error if interval is invalid
 */
export function validateInterval(interval: number, periodType: BudgetPeriod): void {
  if (interval < 1) {
    throw new Error('Interval must be at least 1');
  }

  if (interval > 365) {
    throw new Error('Interval cannot exceed 365');
  }

  // Additional validation based on period type
  switch (periodType) {
    case 'DAILY':
      if (interval > 365) {
        throw new Error('Daily interval cannot exceed 365 days');
      }
      break;
    case 'WEEKLY':
    case 'FORTNIGHTLY':
      if (interval > 52) {
        throw new Error(`${periodType} interval cannot exceed 52`);
      }
      break;
    case 'MONTHLY':
      if (interval > 12) {
        throw new Error('Monthly interval cannot exceed 12 months');
      }
      break;
    case 'ANNUALLY':
      if (interval > 10) {
        throw new Error('Annual interval cannot exceed 10 years');
      }
      break;
  }
}
