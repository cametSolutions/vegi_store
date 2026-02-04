// components/FiltersBar.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Filter as FilterIcon,
  Tags,
  ArrowRightLeft,
  Check,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { getDateRange, DATE_FILTERS } from "../../../../../shared/utils/date";
import { setFilter } from "@/store/slices/filtersSlice";
import DateFilter from "../dateFIlter/DateFilter";

const FiltersBar = ({
  showDateFilter = true,
  showTransactionType = true,
  showOutstandingType = false,
  allowedTxnTypes = [
    // "all",
    "sale",
    "purchase",
    "sales_return",
    "purchase_return",
    "receipt",
    "payment",
    "stock_adjustment",
  ],
  allowedOutstandingTypes = ["receivables", "payables"],
  dateFilter,
  onDateFilterChange,
  onPageReset,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);

  const transactionType = filters.transactionType || "all";
  const outstandingType = filters.outstandingType || null; // "dr" | "cr" | null

  const handleTxnChange = (value) => {
    dispatch(setFilter({ key: "transactionType", value }));
    if (onPageReset) onPageReset();
  };

  const handleOutstandingChange = (value) => {
    let storedValue = null;
    if (value === "receivables") storedValue = "dr";
    else if (value === "payables") storedValue = "cr";

    dispatch(setFilter({ key: "outstandingType", value: storedValue }));
    if (onPageReset) onPageReset();
  };

  const handleDateFilterChange = (filter) => {
    if (onDateFilterChange) onDateFilterChange(filter);
    if (filter !== DATE_FILTERS.CUSTOM) {
      const range = getDateRange(filter);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
    if (onPageReset) onPageReset();
  };

  const handleCustomRangeChange = ({ startDate, endDate }) => {
    dispatch(setFilter({ key: "startDate", value: startDate }));
    dispatch(setFilter({ key: "endDate", value: endDate }));
    if (onPageReset) onPageReset();
  };

  const renderTxnLabel = (type) => {
    const labels = {
      all: "All Transactions",
      sale: "Sales",
      purchase: "Purchases",
      sales_return: "Sales Return",
      purchase_return: "Purchase Return",
      receipt: "Receipts",
      payment: "Payments",
      stock_adjustment: "Stock Adjustments",
    };
    return labels[type] || type;
  };

  const renderOutstandingLabel = (type) => {
    if (type === "dr") return "Receivables";
    if (type === "cr") return "Payables";
    return "All Outstanding";
  };

  return (
    <div className="flex items-center gap-2">
      {/* Transaction Type Filter */}
      {showTransactionType && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium border-dashed border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3"
            >
              <Tags className="w-3.5 h-3.5 mr-2 text-slate-400" />
              {renderTxnLabel(transactionType)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
              Filter by Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allowedTxnTypes.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => handleTxnChange(t)}
                className="text-xs cursor-pointer"
              >
                {transactionType === t && (
                  <Check className="w-3 h-3 mr-2 text-slate-600" />
                )}
                <span className={transactionType === t ? "ml-0" : "ml-5"}>
                  {renderTxnLabel(t)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Outstanding Type Filter */}
      {showOutstandingType && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium border-dashed border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-2 text-slate-400" />
              {renderOutstandingLabel(outstandingType)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
              Filter by Balance
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => handleOutstandingChange(null)}
              className="text-xs cursor-pointer"
            >
              {!outstandingType && (
                <Check className="w-3 h-3 mr-2 text-slate-600" />
              )}
              <span className={!outstandingType ? "ml-0" : "ml-5"}>
                All Outstanding
              </span>
            </DropdownMenuItem>

            {allowedOutstandingTypes.map((t) => {
              const isSelected =
                (t === "receivables" && outstandingType === "dr") ||
                (t === "payables" && outstandingType === "cr");
              return (
                <DropdownMenuItem
                  key={t}
                  onClick={() => handleOutstandingChange(t)}
                  className="text-xs cursor-pointer"
                >
                  {isSelected && (
                    <Check className="w-3 h-3 mr-2 text-slate-600" />
                  )}
                  <span className={isSelected ? "ml-0" : "ml-5"}>
                    {t === "receivables" ? "Receivables (Dr)" : "Payables (Cr)"}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Separator if both groups exist */}
      {(showTransactionType || showOutstandingType) && showDateFilter && (
        <div className="h-4 w-px bg-slate-200 mx-1" />
      )}

      {/* Date Filter */}
      {showDateFilter && (
        <DateFilter
          selectedFilter={dateFilter}
          onFilterChange={handleDateFilterChange}
          onCustomRangeChange={handleCustomRangeChange}
          customStartDate={filters.startDate || ""}
          customEndDate={filters.endDate || ""}
          // Pass modern styling to child
          buttonClassName="h-8 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-3 shadow-sm"
        />
      )}

      {(transactionType !== "all" || outstandingType !== null) && (
        <Button
          variant="ghost"
          size="icon" // changed from size="sm" to "icon" for square shape
          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          onClick={() => {
            handleTxnChange("sale");
            handleOutstandingChange(null);
          }}
          title="Reset Filters" // Tooltip for accessibility
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

export default FiltersBar;
