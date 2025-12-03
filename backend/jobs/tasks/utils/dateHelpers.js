/**
 * =============================================================================
 * DATE HELPERS FOR MONTH CALCULATIONS
 * =============================================================================
 *
 * These utility functions help us work with year-month combinations
 * Used for: finding previous/next months, generating date ranges
 *
 * Author: Midhun Mohan
 * Last Updated: Nov 2025
 * =============================================================================
 */

/**
 * Get the previous month's year and month
 * Example: (2025, 1) → {year: 2024, month: 12}
 * Example: (2025, 6) → {year: 2025, month: 5}
 */
export const getPreviousMonth = (year, month) => {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
};

/**
 * Get the next month's year and month
 * Example: (2024, 12) → {year: 2025, month: 1}
 * Example: (2025, 6) → {year: 2025, month: 7}
 */
export const getNextMonth = (year, month) => {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
};

/**
 * Get start and end dates for a given month
 * Returns: { startDate: Date, endDate: Date }
 * Used for querying transactions within a specific month
 */
export const getMonthDateRange = (year, month) => {
  const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
  const endDate = new Date(year, month, 1); // First day of next month

  return { startDate, endDate };
};

/**
 * Format year-month as readable string
 * Example: (2025, 10) → "2025-10"
 */
export const formatYearMonth = (year, month) => {
  return `${year}-${String(month).padStart(2, "0")}`;
};

/**
 * Sort function for year-month objects
 * Used with Array.sort() to order months chronologically
 * Example: [{year:2025, month:3}, {year:2025, month:1}]
 *          → [{year:2025, month:1}, {year:2025, month:3}]
 */
export const sortMonthsChronologically = (a, b) => {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
};
