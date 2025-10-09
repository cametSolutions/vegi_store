/// Utility to format a date to a readable string
export const formatDate = (date) => new Date(date).toLocaleDateString();

/**
 * Generate period key from date (format: YYYY-MM)
 */
export const generatePeriodKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Get month and year from date
 */
export const getMonthYear = (date) => {
  const d = new Date(date);
  return {
    month: d.getMonth() + 1, // 1-12
    year: d.getFullYear(),
  };
};

/**
 * Calculate due date (add days to transaction date)
 */
export const calculateDueDate = (transactionDate, paymentTermDays = 30) => {
  const dueDate = new Date(transactionDate);
  dueDate.setDate(dueDate.getDate() + paymentTermDays);
  return dueDate;
};

/**
 * Get start and end date of a month
 */
export const getMonthDateRange = (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};
