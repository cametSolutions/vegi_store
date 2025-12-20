// components/dateFilter/DateFilter.jsx
import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Check, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // Assuming you have this from shadcn
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

  const isCustom = selectedFilter === DATE_FILTERS.CUSTOM;

  // Helper to render consistent menu items
  const renderMenuItem = (filterKey, label) => {
    const range = getDateRange(filterKey);
    const isActive = selectedFilter === filterKey;
    const displayDate = range.displayEnd 
      ? `${range.displayStart} - ${range.displayEnd}`
      : range.displayStart;

    return (
      <DropdownMenuItem
        key={filterKey}
        onClick={() => handleFilterSelect(filterKey)}
        className={`cursor-pointer text-xs py-2.5 flex items-center justify-between ${
          isActive ? "bg-slate-50 text-slate-900" : "text-slate-600"
        }`}
      >
        <div className="flex items-center gap-2">
          {isActive && <Check className="w-3.5 h-3.5 text-sky-600" />}
          <span className={isActive ? "ml-0 font-medium" : "ml-5.5"}>{label}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono ml-4">{displayDate}</span>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-3 shadow-sm ${buttonClassName}`}
        >
          <CalendarIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
          {isCustom && (localStart || localEnd)
            ? `${localStart || "Start"} - ${localEnd || "End"}`
            : getFilterLabel(selectedFilter)}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 bg-white border border-slate-200 shadow-lg rounded-lg p-1"
      >
        {/* Custom Range Section */}
        <div className="p-2 bg-slate-50/50 rounded-md mb-1 border border-slate-100">
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => handleFilterSelect(DATE_FILTERS.CUSTOM)}
            className="cursor-pointer p-0 focus:bg-transparent"
          >
            <div className="flex items-center gap-2 mb-2 w-full">
               <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isCustom ? "border-sky-500 bg-sky-50" : "border-slate-300"}`}>
                  {isCustom && <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
               </div>
               <span className={`text-xs font-medium ${isCustom ? "text-sky-700" : "text-slate-700"}`}>Custom Range</span>
            </div>
          </DropdownMenuItem>

          {/* Inputs always visible but enabled logic applied visually */}
          <div className={`grid grid-cols-2 gap-2 transition-opacity ${isCustom ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">From</label>
              <input
                type="date"
                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-600"
                value={localStart}
                onChange={(e) => handleCustomChange("start", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">To</label>
              <input
                type="date"
                className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-600"
                value={localEnd}
                onChange={(e) => handleCustomChange("end", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-slate-100 my-1" />
        
        <DropdownMenuLabel className="text-[10px] text-slate-400 font-normal px-2 py-1">Presets</DropdownMenuLabel>

        {renderMenuItem(DATE_FILTERS.TODAY, "Today")}
        {renderMenuItem(DATE_FILTERS.YESTERDAY, "Yesterday")}
        
        <DropdownMenuSeparator className="bg-slate-100 my-1" />
        
        {renderMenuItem(DATE_FILTERS.THIS_WEEK, "This Week")}
        {renderMenuItem(DATE_FILTERS.LAST_WEEK, "Last Week")}
        {renderMenuItem(DATE_FILTERS.LAST_7_DAYS, "Last 7 Days")}
        
        <DropdownMenuSeparator className="bg-slate-100 my-1" />
        
        {renderMenuItem(DATE_FILTERS.THIS_MONTH, "This Month")}
        {renderMenuItem(DATE_FILTERS.LAST_MONTH, "Last Month")}

      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DateFilter;
