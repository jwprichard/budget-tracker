/**
 * Formatting Utilities
 * Common formatting functions for currency, dates, and numbers
 */

/**
 * Format a number as currency (NZD)
 * @param amount The amount to format
 * @param options Optional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
};

/**
 * Format a date as a readable string
 * @param date The date to format (Date object or ISO string)
 * @param options Optional Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

/**
 * Format a date as YYYY-MM-DD for input fields
 * @param date The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const isoString = dateObj.toISOString();
  const datePart = isoString.split('T')[0];
  return datePart || isoString;
};

/**
 * Format a number with thousands separators
 * @param num The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-NZ').format(num);
};

/**
 * Format a percentage
 * @param value The decimal value (e.g., 0.25 for 25%)
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Truncate text to a maximum length with ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength)}...`;
};
