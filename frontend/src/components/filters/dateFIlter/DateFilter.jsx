
import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
DATE_FILTERS,
getDateRange,
getFilterLabel,
} from "../../../../../shared/utils/date";

const DateFilter = ({
  selectedFilter = DATE_FILTERS.THIS_MONTH,
  onFilterChange,
  onCustomRangeChange,
  buttonClassName = "",
  customStartDate,
  customEndDate,
}) => {
  const [localStart, setLocalStart] = useState(customStartDate || "");
  const [localEnd, setLocalEnd] = useState(customEndDate || "");

  useEffect(() => {
    setLocalStart(customStartDate || "");
  }, [customStartDate]);

  useEffect(() => {
    setLocalEnd(customEndDate || "");
  }, [customEndDate]);

  const handleFilterSelect = (filterType) => {
    if (onFilterChange) onFilterChange(filterType);
  };

  const handleCustomChange = (field, value) => {
    const nextStart = field === "start" ? value : localStart;
    const nextEnd = field === "end" ? value : localEnd;

    setLocalStart(nextStart);
    setLocalEnd(nextEnd);

    if (onCustomRangeChange) {
      onCustomRangeChange({
        startDate: nextStart || null,
        endDate: nextEnd || null,
      });
    }
  };

  const todayRange = getDateRange(DATE_FILTERS.TODAY);
  const yesterdayRange = getDateRange(DATE_FILTERS.YESTERDAY);
  const thisWeekRange = getDateRange(DATE_FILTERS.THIS_WEEK);
  const lastWeekRange = getDateRange(DATE_FILTERS.LAST_WEEK);
  const last7DaysRange = getDateRange(DATE_FILTERS.LAST_7_DAYS);
  const thisMonthRange = getDateRange(DATE_FILTERS.THIS_MONTH);
  const lastMonthRange = getDateRange(DATE_FILTERS.LAST_MONTH);

  const isCustom = selectedFilter === DATE_FILTERS.CUSTOM;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center gap-2 px-4 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition border border-gray-300 focus:outline-none ${buttonClassName}`}
      >
        <Calendar className="w-3 h-3" />
        <span className="text-xs font-medium">
          {isCustom && (localStart || localEnd)
            ? `${localStart || "Start"} - ${localEnd || "End"}`
            : getFilterLabel(selectedFilter)}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-white border border-gray-200 shadow-lg rounded-lg p-2"
      >
        {/* Custom Range header as item (just selects CUSTOM) */}
        <DropdownMenuItem
          // prevent default so menu doesn't close when we click this
          onSelect={(e) => e.preventDefault()}
          onClick={() => handleFilterSelect(DATE_FILTERS.CUSTOM)}
          className={`cursor-pointer rounded-md px-3 py-2.5 mb-1 ${
            isCustom ? "bg-blue-50 text-blue-700" : "text-gray-700"
          } hover:bg-gray-100 focus:bg-gray-100 flex flex-col items-start gap-2`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Custom Range</span>
            </div>
          </div>
        </DropdownMenuItem>

        {/* Custom inputs OUTSIDE item so typing does not trigger select/close */}
        {isCustom && (
          <div className="flex items-center gap-2 w-full mt-1 px-3 pb-2">
            <input
              type="date"
              className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
              value={localStart}
              onChange={(e) => handleCustomChange("start", e.target.value)}
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
              value={localEnd}
              onChange={(e) => handleCustomChange("end", e.target.value)}
            />
          </div>
        )}

        <div className="h-px bg-gray-200 my-2" />

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
            <span className="text-xs text-gray-500">
              {todayRange.displayStart}
            </span>
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

        <div className="h-px bg-gray-200 my-2" />

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
