// ======================================================
// BASIC DATE FORMATTERS
// ======================================================

// Format date as DD/MM/YYYY
export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB");

// Format date as Jan 1, 2025
export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Format date as YYYY-MM-DD (LOCAL TIME — NO UTC SHIFT)
export const formatYYYYMMDDLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ======================================================
// PERIOD / MONTH HELPERS
// ======================================================

// Generate period key: YYYY-MM
export const generatePeriodKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Get month and year
export const getMonthYear = (date) => {
  const d = new Date(date);
  return {
    month: d.getMonth() + 1, // 1–12
    year: d.getFullYear(),
  };
};

// ======================================================
// DUE DATE
// ======================================================

export const calculateDueDate = (transactionDate, paymentTermDays = 30) => {
  const dueDate = new Date(transactionDate);
  dueDate.setDate(dueDate.getDate() + paymentTermDays);
  return dueDate;
};

// ======================================================
// MONTH RANGE
// ======================================================

export const getMonthDateRange = (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

// ======================================================
// DATE FILTER TYPES
// ======================================================

export const DATE_FILTERS = {
  CUSTOM: "custom",
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "this_week",
  LAST_WEEK: "last_week",
  LAST_7_DAYS: "last_7_days",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
};

// ======================================================
// DISPLAY FORMAT (DD-MMM-YYYY)
// ======================================================

export const formatDisplayDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// ======================================================
// MAIN DATE RANGE HANDLER (FIXED)
// ======================================================

export const getDateRange = (filterType) => {
  const today = new Date();
  let start, end;

  switch (filterType) {
    case DATE_FILTERS.TODAY:
      start = new Date(today);
      end = new Date(today);
      break;

    case DATE_FILTERS.YESTERDAY:
      start = new Date(today);
      start.setDate(start.getDate() - 1);
      end = new Date(start);
      break;

    case DATE_FILTERS.THIS_WEEK: {
      const currentDay = today.getDay();
      const diff = currentDay === 0 ? -6 : 1 - currentDay;
      start = new Date(today);
      start.setDate(today.getDate() + diff);
      end = new Date(today);
      break;
    }

    case DATE_FILTERS.LAST_WEEK: {
      const day = today.getDay();
      const diff = day === 0 ? -13 : -6 - day;
      start = new Date(today);
      start.setDate(today.getDate() + diff);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      break;
    }

    case DATE_FILTERS.LAST_7_DAYS:
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      end = new Date(today);
      break;

    case DATE_FILTERS.THIS_MONTH:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;

    case DATE_FILTERS.LAST_MONTH:
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;

    default:
      return {
        start: null,
        end: null,
        displayStart: null,
        displayEnd: null,
      };
  }

  return {
    start: formatYYYYMMDDLocal(start), // ✅ SAFE
    end: formatYYYYMMDDLocal(end),     // ✅ SAFE
    displayStart: formatDisplayDate(start),
    displayEnd: formatDisplayDate(end),
  };
};

// ======================================================
// FILTER LABELS
// ======================================================

export const getFilterLabel = (filterType) => {
  switch (filterType) {
    case DATE_FILTERS.TODAY:
      return "Today";
    case DATE_FILTERS.YESTERDAY:
      return "Yesterday";
    case DATE_FILTERS.THIS_WEEK:
      return "This Week";
    case DATE_FILTERS.LAST_WEEK:
      return "Last Week";
    case DATE_FILTERS.LAST_7_DAYS:
      return "Last 7 Days";
    case DATE_FILTERS.THIS_MONTH:
      return "This Month";
    case DATE_FILTERS.LAST_MONTH:
      return "Last Month";
    case DATE_FILTERS.CUSTOM:
      return "Custom Range";
    default:
      return "Date Filter";
  }
};
