/**
 * Analytics Helper Utilities
 * Shared functions for analytics pages
 */

/**
 * Format date for input (ISO format: YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get default date range for analytics filters
 * @param days - Number of days to go back from today
 * @returns Object with startDate and endDate in ISO format
 */
export const getDefaultDateRange = (days: number) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(today),
  };
};

/**
 * Get preset date ranges
 */
export const getPresetDateRanges = () => {
  const today = new Date();

  // Last 7 days
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);

  // Last 30 days
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  // Last 90 days
  const last90Days = new Date(today);
  last90Days.setDate(today.getDate() - 90);

  // This month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // This year
  const thisYearStart = new Date(today.getFullYear(), 0, 1);

  return {
    last7Days: {
      label: 'Last 7 Days',
      startDate: formatDateForInput(last7Days),
      endDate: formatDateForInput(today),
    },
    last30Days: {
      label: 'Last 30 Days',
      startDate: formatDateForInput(last30Days),
      endDate: formatDateForInput(today),
    },
    last90Days: {
      label: 'Last 90 Days',
      startDate: formatDateForInput(last90Days),
      endDate: formatDateForInput(today),
    },
    thisMonth: {
      label: 'This Month',
      startDate: formatDateForInput(thisMonthStart),
      endDate: formatDateForInput(today),
    },
    lastMonth: {
      label: 'Last Month',
      startDate: formatDateForInput(lastMonthStart),
      endDate: formatDateForInput(lastMonthEnd),
    },
    thisYear: {
      label: 'This Year',
      startDate: formatDateForInput(thisYearStart),
      endDate: formatDateForInput(today),
    },
  };
};
