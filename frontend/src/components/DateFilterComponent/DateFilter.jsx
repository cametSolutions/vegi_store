import React from "react";
import { Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Date filter presets
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

// Helper function to format date as DD-MMM-YYYY
const formatDisplayDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to get date range
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

    case DATE_FILTERS.THIS_WEEK:
      // Get Monday of current week
      const currentDay = today.getDay();
      const diff = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
      start = new Date(today);
      start.setDate(today.getDate() + diff);
      end = new Date(today);
      break;

    case DATE_FILTERS.LAST_WEEK:
      // Get Monday of last week
      const lastWeekDay = today.getDay();
      const lastWeekDiff = lastWeekDay === 0 ? -13 : -6 - lastWeekDay;
      start = new Date(today);
      start.setDate(today.getDate() + lastWeekDiff);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      break;

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
      return { start: null, end: null, displayStart: null, displayEnd: null };
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    displayStart: formatDisplayDate(start),
    displayEnd: formatDisplayDate(end),
  };
};

// Helper function to get filter label
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

/**
 * Modern DateFilter Component with date ranges displayed
 * @param {Object} props
 * @param {string} props.selectedFilter - Currently selected date filter
 * @param {function} props.onFilterChange - Callback when filter changes
 * @param {string} props.buttonClassName - Optional custom button classes
 */
const DateFilter = ({ 
  selectedFilter = DATE_FILTERS.THIS_MONTH, 
  onFilterChange,
  buttonClassName = ""
}) => {
  const handleFilterSelect = (filterType) => {
    if (onFilterChange) {
      onFilterChange(filterType);
    }
  };

  // Get current date ranges for display
  const todayRange = getDateRange(DATE_FILTERS.TODAY);
  const yesterdayRange = getDateRange(DATE_FILTERS.YESTERDAY);
  const thisWeekRange = getDateRange(DATE_FILTERS.THIS_WEEK);
  const lastWeekRange = getDateRange(DATE_FILTERS.LAST_WEEK);
  const last7DaysRange = getDateRange(DATE_FILTERS.LAST_7_DAYS);
  const thisMonthRange = getDateRange(DATE_FILTERS.THIS_MONTH);
  const lastMonthRange = getDateRange(DATE_FILTERS.LAST_MONTH);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition border border-gray-300 focus:outline-none ${buttonClassName}`}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">{getFilterLabel(selectedFilter)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-white border border-gray-200 shadow-lg rounded-lg p-2"
      >
        {/* Custom Range */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.CUSTOM)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.CUSTOM
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Custom Range</span>
            </div>
          </div>
        </DropdownMenuItem>

        {/* Divider */}
        <div className="h-px bg-gray-200 my-2"></div>

        {/* Today */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.TODAY)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.TODAY
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Today</span>
            </div>
            <span className="text-xs text-gray-500">{todayRange.displayStart}</span>
          </div>
        </DropdownMenuItem>

        {/* Yesterday */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.YESTERDAY)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.YESTERDAY
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Yesterday</span>
            </div>
            <span className="text-xs text-gray-500">
              {yesterdayRange.displayStart} - {yesterdayRange.displayEnd}
            </span>
          </div>
        </DropdownMenuItem>

        {/* This Week */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.THIS_WEEK)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.THIS_WEEK
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">This Week</span>
            </div>
            <span className="text-xs text-gray-500">
              {thisWeekRange.displayStart} - {thisWeekRange.displayEnd}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Last Week */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.LAST_WEEK)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.LAST_WEEK
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Last Week</span>
            </div>
            <span className="text-xs text-gray-500">
              {lastWeekRange.displayStart} - {lastWeekRange.displayEnd}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Last 7 Days */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.LAST_7_DAYS)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.LAST_7_DAYS
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Last 7 Days</span>
            </div>
            <span className="text-xs text-gray-500">
              {last7DaysRange.displayStart} - {last7DaysRange.displayEnd}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Divider */}
        <div className="h-px bg-gray-200 my-2"></div>

        {/* This Month */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.THIS_MONTH)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.THIS_MONTH
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">This Month</span>
            </div>
            <span className="text-xs text-gray-500">
              {thisMonthRange.displayStart} - {thisMonthRange.displayEnd}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Last Month */}
        <DropdownMenuItem
          onClick={() => handleFilterSelect(DATE_FILTERS.LAST_MONTH)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            selectedFilter === DATE_FILTERS.LAST_MONTH
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Last Month</span>
            </div>
            <span className="text-xs text-gray-500">
              {lastMonthRange.displayStart} - {lastMonthRange.displayEnd}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DateFilter;
