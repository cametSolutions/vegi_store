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

import { getDateRange,DATE_FILTERS } from "../../../../../shared/utils/date";
import { setFilter } from "@/store/slices/filtersSlice";
import DateFilter from "../dateFIlter/DateFilter";

/**
 * @param {Object} props
 * @param {boolean} props.showDateFilter
 * @param {boolean} props.showTransactionType
 * @param {boolean} props.showOutstandingType
 * @param {Array<'all'|'sale'|'purchase'|'sales_return'|'purchase_return'>} props.allowedTxnTypes
 * @param {Array<'receivables'|'payables'>} props.allowedOutstandingTypes
 * @param {string} props.dateFilter
 * @param {function} props.onDateFilterChange
 * @param {function} props.onPageReset
 */
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
  const outstandingType = filters.outstandingType || null;

  const isCustomFilterActive = dateFilter === DATE_FILTERS.CUSTOM;

  const handleTxnChange = (value) => {
    dispatch(setFilter({ key: "transactionType", value }));
    if (onPageReset) onPageReset();
  };

  const handleOutstandingChange = (value) => {
    dispatch(setFilter({ key: "outstandingType", value }));
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

  const renderOutstandingLabel = (type) => {
    switch (type) {
      case "receivables":
        return "Receivables (Return Dr)";
      case "payables":
        return "Payables (Return Cr)";
      default:
        return type;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Transaction type (configurable) */}
      {showTransactionType && (
        <div className="flex items-center gap-1">
          <FilterIcon className="w-3 h-3 text-gray-500" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2"
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

      {/* Outstanding type (configurable) */}
      {showOutstandingType && (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-gray-600">Outstanding</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2"
              >
                {outstandingType
                  ? renderOutstandingLabel(outstandingType)
                  : "All"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOutstandingChange(null)}>
                All
              </DropdownMenuItem>
              {allowedOutstandingTypes.map((t) => (
                <DropdownMenuItem
                  key={t}
                  onClick={() => handleOutstandingChange(t)}
                >
                  {renderOutstandingLabel(t)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Date filter (can be hidden via prop) */}
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
