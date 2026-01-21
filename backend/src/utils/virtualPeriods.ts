/**
 * Virtual Period Generation Utilities
 * Functions for calculating budget periods on-the-fly from templates
 */

import { BudgetPeriod, BudgetType, BudgetTemplate } from '@prisma/client';
import { calculatePeriodEndDate, calculateNextPeriodStart } from './periodCalculations';

/**
 * Represents a virtual budget period calculated from a template
 */
export interface VirtualPeriod {
  // Composite ID for virtual periods: "virtual_{templateId}_{startDateISO}"
  id: string;
  templateId: string;
  userId: string;
  categoryId: string;

  // Budget values from template
  amount: number;
  type: BudgetType;
  periodType: BudgetPeriod;
  interval: number;
  includeSubcategories: boolean;

  // Period boundaries
  startDate: Date;
  endDate: Date;

  // Metadata
  name: string;
  notes: string | null;

  // Flag to distinguish from real Budget records
  isVirtual: true;
}

/**
 * Template with category info for period generation
 */
export type TemplateWithCategory = BudgetTemplate & {
  category?: {
    id: string;
    name: string;
    color: string;
  };
};

/**
 * Generate a unique ID for a virtual period
 * Format: "virtual_{templateId}_{startDate as ISO string}"
 */
export function getVirtualPeriodId(templateId: string, startDate: Date): string {
  return `virtual_${templateId}_${startDate.toISOString()}`;
}

/**
 * Parse a virtual period ID to extract templateId and startDate
 * Returns null if not a valid virtual period ID
 */
export function parseVirtualPeriodId(id: string): { templateId: string; startDate: Date } | null {
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

  const startDateStr = parts.slice(2).join('_'); // Handle ISO date with colons

  try {
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return null;
    }
    return { templateId, startDate };
  } catch {
    return null;
  }
}

/**
 * Check if an ID represents a virtual period
 */
export function isVirtualPeriodId(id: string): boolean {
  return id.startsWith('virtual_');
}

/**
 * Generate virtual periods for a template within a date range
 *
 * @param template - The budget template
 * @param rangeStart - Start of the date range (inclusive)
 * @param rangeEnd - End of the date range (inclusive)
 * @returns Array of virtual periods that fall within the range
 */
export function generateVirtualPeriods(
  template: TemplateWithCategory,
  rangeStart: Date,
  rangeEnd: Date
): VirtualPeriod[] {
  const periods: VirtualPeriod[] = [];

  // Start from the template's first start date
  let currentStart = new Date(template.firstStartDate);

  // If the template hasn't started yet, check if its first period falls in range
  if (currentStart > rangeEnd) {
    return periods;
  }

  // Walk through periods until we're past the range end or template end
  const maxIterations = 1000; // Safety limit
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Calculate period end
    const periodEnd = calculatePeriodEndDate(
      currentStart,
      template.periodType,
      template.interval
    );

    if (!periodEnd) {
      // Should not happen for templates (they always have periodType)
      break;
    }

    // Check if this period overlaps with the requested range
    // A period overlaps if: periodStart < rangeEnd AND periodEnd > rangeStart
    if (currentStart < rangeEnd && periodEnd > rangeStart) {
      // Check template end date
      if (template.endDate && currentStart >= template.endDate) {
        break;
      }

      periods.push({
        id: getVirtualPeriodId(template.id, currentStart),
        templateId: template.id,
        userId: template.userId,
        categoryId: template.categoryId,
        amount: Number(template.amount),
        type: template.type,
        periodType: template.periodType,
        interval: template.interval,
        includeSubcategories: template.includeSubcategories,
        startDate: new Date(currentStart),
        endDate: new Date(periodEnd),
        name: template.name,
        notes: template.notes,
        isVirtual: true,
      });
    }

    // Move to next period
    currentStart = periodEnd;

    // Stop if we've passed the range end
    if (currentStart >= rangeEnd) {
      break;
    }

    // Stop if we've passed the template's end date
    if (template.endDate && currentStart >= template.endDate) {
      break;
    }
  }

  return periods;
}

/**
 * Find the period that contains a specific date for a template
 *
 * @param template - The budget template
 * @param targetDate - The date to find a period for
 * @returns The virtual period containing the date, or null if none
 */
export function findPeriodForDate(
  template: TemplateWithCategory,
  targetDate: Date
): VirtualPeriod | null {
  // Start from the template's first start date
  let currentStart = new Date(template.firstStartDate);

  // If target date is before template starts, no period exists
  if (targetDate < currentStart) {
    return null;
  }

  // Walk through periods to find the one containing targetDate
  const maxIterations = 1000;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const periodEnd = calculatePeriodEndDate(
      currentStart,
      template.periodType,
      template.interval
    );

    if (!periodEnd) {
      break;
    }

    // Check if target date is in this period
    if (targetDate >= currentStart && targetDate < periodEnd) {
      // Check template end date
      if (template.endDate && currentStart >= template.endDate) {
        return null;
      }

      return {
        id: getVirtualPeriodId(template.id, currentStart),
        templateId: template.id,
        userId: template.userId,
        categoryId: template.categoryId,
        amount: Number(template.amount),
        type: template.type,
        periodType: template.periodType,
        interval: template.interval,
        includeSubcategories: template.includeSubcategories,
        startDate: new Date(currentStart),
        endDate: new Date(periodEnd),
        name: template.name,
        notes: template.notes,
        isVirtual: true,
      };
    }

    // Move to next period
    currentStart = periodEnd;

    // Stop if template has ended
    if (template.endDate && currentStart >= template.endDate) {
      break;
    }
  }

  return null;
}

/**
 * Get the current active period for a template (the one containing "now")
 */
export function getCurrentPeriod(template: TemplateWithCategory): VirtualPeriod | null {
  return findPeriodForDate(template, new Date());
}

/**
 * Get the next upcoming period for a template (the one after "now")
 */
export function getNextPeriod(template: TemplateWithCategory): VirtualPeriod | null {
  const now = new Date();
  const currentPeriod = findPeriodForDate(template, now);

  if (!currentPeriod) {
    // Template might not have started yet
    if (new Date(template.firstStartDate) > now) {
      // Return first period as "next"
      return findPeriodForDate(template, new Date(template.firstStartDate));
    }
    return null;
  }

  // Find the period after current
  return findPeriodForDate(template, currentPeriod.endDate);
}

/**
 * Generate a limited number of future periods from a template
 * Useful for displaying "upcoming periods" in the UI
 *
 * @param template - The budget template
 * @param count - Number of periods to generate
 * @param fromDate - Start generating from this date (default: now)
 * @returns Array of virtual periods
 */
export function generateFuturePeriods(
  template: TemplateWithCategory,
  count: number,
  fromDate: Date = new Date()
): VirtualPeriod[] {
  const periods: VirtualPeriod[] = [];

  // Find the first period that includes or is after fromDate
  let currentStart = new Date(template.firstStartDate);

  // Advance to the period containing or after fromDate
  let iterations = 0;
  const maxIterations = 1000;

  while (currentStart < fromDate && iterations < maxIterations) {
    iterations++;
    const nextStart = calculateNextPeriodStart(
      currentStart,
      template.periodType,
      template.interval
    );
    if (nextStart <= currentStart) break; // Safety check
    currentStart = nextStart;
  }

  // Now generate 'count' periods
  for (let i = 0; i < count && iterations < maxIterations; i++) {
    iterations++;

    // Check template end date
    if (template.endDate && currentStart >= template.endDate) {
      break;
    }

    const periodEnd = calculatePeriodEndDate(
      currentStart,
      template.periodType,
      template.interval
    );

    if (!periodEnd) break;

    periods.push({
      id: getVirtualPeriodId(template.id, currentStart),
      templateId: template.id,
      userId: template.userId,
      categoryId: template.categoryId,
      amount: Number(template.amount),
      type: template.type,
      periodType: template.periodType,
      interval: template.interval,
      includeSubcategories: template.includeSubcategories,
      startDate: new Date(currentStart),
      endDate: new Date(periodEnd),
      name: template.name,
      notes: template.notes,
      isVirtual: true,
    });

    currentStart = periodEnd;
  }

  return periods;
}
