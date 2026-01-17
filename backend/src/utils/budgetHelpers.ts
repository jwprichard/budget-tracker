/**
 * Budget utility functions for period calculations, status determination, and formatting
 */

import { BudgetPeriod, BudgetStatus } from '../types/budget.types';

/**
 * Calculate start and end dates for a budget period
 */
export function getPeriodBoundaries(
  periodType: BudgetPeriod,
  year: number,
  periodNumber: number
): { startDate: Date; endDate: Date } {
  switch (periodType) {
    case 'DAILY':
    case 'WEEKLY':
    case 'FORTNIGHTLY':
      return getISOWeekBoundaries(year, periodNumber);

    case 'MONTHLY':
      // Month boundaries (periodNumber: 1-12)
      return {
        startDate: new Date(year, periodNumber - 1, 1, 0, 0, 0, 0),
        endDate: new Date(year, periodNumber, 0, 23, 59, 59, 999), // Last day of month
      };

    case 'ANNUALLY':
      // Annual boundaries (periodNumber: 1)
      return {
        startDate: new Date(year, 0, 1, 0, 0, 0, 0),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999),
      };

    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Get the current period for a given period type
 */
export function getCurrentPeriod(periodType: BudgetPeriod): {
  year: number;
  periodNumber: number;
} {
  const now = new Date();
  const year = now.getFullYear();

  switch (periodType) {
    case 'DAILY':
      return { year, periodNumber: Math.floor((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1 };

    case 'WEEKLY':
      return { year, periodNumber: getISOWeek(now) };

    case 'FORTNIGHTLY':
      return { year, periodNumber: Math.floor(getISOWeek(now) / 2) + 1 };

    case 'MONTHLY':
      return { year, periodNumber: now.getMonth() + 1 }; // 1-12

    case 'ANNUALLY':
      return { year, periodNumber: 1 };

    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Calculate budget status based on spent amount and budget amount
 */
export function calculateBudgetStatus(
  spent: number,
  budgetAmount: number
): { status: BudgetStatus; percentage: number; remaining: number } {
  const percentage = (spent / budgetAmount) * 100;
  const remaining = budgetAmount - spent;

  let status: BudgetStatus;
  if (percentage < 50) {
    status = 'UNDER_BUDGET';
  } else if (percentage < 80) {
    status = 'ON_TRACK';
  } else if (percentage < 100) {
    status = 'WARNING';
  } else {
    status = 'EXCEEDED';
  }

  return { status, percentage, remaining };
}

/**
 * Format period for display
 * Examples: "January 2026", "Q1 2026", "Week 12 2026", "2026"
 */
export function formatPeriod(
  periodType: BudgetPeriod,
  year: number,
  periodNumber: number
): string {
  switch (periodType) {
    case 'DAILY':
      return `Day ${periodNumber} ${year}`;

    case 'WEEKLY':
      return `Week ${periodNumber} ${year}`;

    case 'FORTNIGHTLY':
      return `Fortnight ${periodNumber} ${year}`;

    case 'MONTHLY':
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${monthNames[periodNumber - 1]} ${year}`;

    case 'ANNUALLY':
      return `${year}`;

    default:
      return `${periodType} ${periodNumber} ${year}`;
  }
}

/**
 * Get ISO week number for a date (1-53)
 * ISO 8601: Week 1 is the first week with Thursday in it
 */
export function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Get start and end dates for an ISO week
 */
export function getISOWeekBoundaries(
  year: number,
  week: number
): { startDate: Date; endDate: Date } {
  // ISO week starts on Monday
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const isoWeekStart = simple;

  if (dayOfWeek <= 4) {
    isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  const startDate = new Date(isoWeekStart);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(isoWeekStart);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}
