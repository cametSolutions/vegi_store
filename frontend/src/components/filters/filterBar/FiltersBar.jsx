// components/FiltersBar.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Filter as FilterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getDateRange, DATE_FILTERS } from "../../../../../shared/utils/date";
import { setFilter } from "@/store/slices/filtersSlice";
import DateFilter from "../dateFIlter/DateFilter";

const FiltersBar = ({
  showDateFilter = true,
  showTransactionType = true,
  showOutstandingType = false,
  allowedTxnTypes = [
    "all",
    "sale",
    "purchase",
    "sales_return",
    "purchase_return",
  ],
  allowedOutstandingTypes = ["receivables", "payables"],
  dateFilter,
  onDateFilterChange,
  onPageReset,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);

  const transactionType = filters.transactionType || "all";
  // slice stores "dr" | "cr" | null
  const outstandingType = filters.outstandingType || null;

  const isCustomFilterActive = dateFilter === DATE_FILTERS.CUSTOM;

  const handleTxnChange = (value) => {
    dispatch(setFilter({ key: "transactionType", value }));
    if (onPageReset) onPageReset();
  };

  // Store "dr" / "cr" / null in Redux
  const handleOutstandingChange = (value) => {
    let storedValue = null; // default "All"
    if (value === "receivables") {
      storedValue = "dr";
    } else if (value === "payables") {
      storedValue = "cr";
    } else {
      storedValue = null; // all
    }

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
    switch (type) {
      case "all":
        return "All";
      case "sale":
        return "Sale";
      case "purchase":
        return "Purchase";
      case "sales_return":
        return "Sales Return";
      case "purchase_return":
        return "Purchase Return";
      default:
        return type;
    }
  };

  // Map stored dr/cr to human‑readable text
  const renderOutstandingLabel = (type) => {
    switch (type) {
      case "dr":
        return "Receivables (Dr)";
      case "cr":
        return "Payables (Cr)";
      default:
        return "All";
    }
  };

  return (
    <div className="flex items-center gap-2 ">
       <FilterIcon className="w-3 h-3 text-gray-500 mr-1" />
      {/* Transaction type */}
      {showTransactionType && (
        <div className="flex items-center gap-1">
         
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2 bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
              >
                {renderTxnLabel(transactionType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {allowedTxnTypes.map((t) => (
                <DropdownMenuItem key={t} onClick={() => handleTxnChange(t)}>
                  {renderTxnLabel(t)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Outstanding type */}
      {showOutstandingType && (
        <div className="flex items-center gap-1">
          <span className="text-[12px] text-gray-600 mr-1
          ">Outstanding</span>
          <DropdownMenu className="bg-gray-500">
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2 bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
              >
                {renderOutstandingLabel(outstandingType)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* All */}
              <DropdownMenuItem onClick={() => handleOutstandingChange(null)}>
                All
              </DropdownMenuItem>

              {/* Receivables / Payables */}
              {allowedOutstandingTypes.map((t) => (
                <DropdownMenuItem
                  key={t}
                  onClick={() => handleOutstandingChange(t)}
                >
                  {t === "receivables"
                    ? "Receivables (Dr)"
                    : "Payables (Cr)"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Date filter */}
      {showDateFilter && (
        <DateFilter
          selectedFilter={dateFilter}
          onFilterChange={handleDateFilterChange}
          onCustomRangeChange={handleCustomRangeChange}
          customStartDate={filters.startDate || ""}
          customEndDate={filters.endDate || ""}
          buttonClassName="h-8 text-xs px-2"
        />
      )}
    </div>
  );
};

export default FiltersBar;
