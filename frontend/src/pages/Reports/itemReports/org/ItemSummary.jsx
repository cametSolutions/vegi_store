import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

import DateFilter from "@/components/DateFilterComponent/DateFilter";
import { DATE_FILTERS, formatDate, getDateRange } from "../../../../../../shared/utils/date";
import { itemMasterQueries } from "@/hooks/queries/item.queries";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ItemSummaryPage = () => {
  const companyId = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const branchId = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );

  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const [transactionType, setTransactionType] = useState("all"); // 'sale' | 'purchase' | 'all'
  const [customDateRange, setCustomDateRange] = useState({
    from: "",
    to: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  const isCustomFilterActive = dateFilter === DATE_FILTERS.CUSTOM;

  // Build startDate / endDate (YYYY-MM-DD)
  const dateParams = useMemo(() => {
    if (isCustomFilterActive && customDateRange.from && customDateRange.to) {
      return {
        startDate: customDateRange.from,
        endDate: customDateRange.to,
      };
    }

    const range = getDateRange(dateFilter);
    return {
      startDate: range.start, // already "YYYY-MM-DD"
      endDate: range.end,
    };
  }, [dateFilter, customDateRange, isCustomFilterActive]);

  // Build query options from query factory
  const queryOptions = itemMasterQueries.getItemSummary(companyId, branchId, {
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    transactionType: transactionType !== "all" ? transactionType : undefined,
    page: currentPage,
    limit,
  });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...queryOptions,
    enabled: !!companyId && !!branchId,
  });

  const summaryData = data?.items || [];
  const pagination = data?.pagination || {
    page: currentPage,
    limit,
    totalItems: 0,
    totalPages: 1,
  };
  const appliedFilters = data?.filters || {};

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== DATE_FILTERS.CUSTOM) {
      setCustomDateRange({ from: "", to: "" });
    }
    setCurrentPage(1);
  };

  const handleTransactionTypeChange = (type) => {
    setTransactionType(type);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar: title + filters (compact, like sales summary) */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <h1 className="text-base font-semibold">Item Summary</h1>

        <div className="flex items-center gap-2">
          {/* Transaction type */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-gray-500" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2"
                >
                  {transactionType === "all"
                    ? "All"
                    : transactionType === "sale"
                    ? "Sale"
                    : "Purchase"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleTransactionTypeChange("all")}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTransactionTypeChange("sale")}
                >
                  Sale
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTransactionTypeChange("purchase")}
                >
                  Purchase
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date filter dropdown */}
          <DateFilter
            selectedFilter={dateFilter}
            onFilterChange={handleDateFilterChange}
            buttonClassName="h-8 text-xs px-2"
          />

          {/* Custom date range inline */}
          {isCustomFilterActive && (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={customDateRange.from}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    from: e.target.value,
                  }))
                }
                className="h-8 w-32 text-xs"
              />
              <span className="text-xs text-gray-500">to</span>
              <Input
                type="date"
                value={customDateRange.to}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    to: e.target.value,
                  }))
                }
                className="h-8 w-32 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Small filter badges row (like a sub-header) */}
      <div className="px-4 py-1 border-b bg-gray-50 text-[11px] flex gap-2">
        {transactionType !== "all" && (
          <Badge variant="secondary" className="px-2 py-0 h-5 text-[11px]">
            {transactionType.toUpperCase()}
            <button
              type="button"
              className="ml-1"
              onClick={() => handleTransactionTypeChange("all")}
            >
              ×
            </button>
          </Badge>
        )}

        {appliedFilters.startDate && appliedFilters.endDate && (
          <div variant="secondary" className="px- py-0 h-5 text-[11px]">
            {formatDate(appliedFilters.startDate)} - {formatDate(appliedFilters.endDate)}
          </div>
        )}
      </div>

      {/* Table + bottom bar inside one card, but slimmer */}
      <div className=" mt-0 rounded-none flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Loading item summary…
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-500 text-sm">
              Failed to load item summary: {error?.message}
            </div>
          ) : summaryData.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No data for selected filters.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-300 border-b">
                <tr className="h-10">
                  <th className="px-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-3 text-left font-medium text-gray-600">
                    Item
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600">
                    Unit
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600">
                    Qty In
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600">
                    Qty Out
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600">
                    Amount In
                  </th>
                  <th className="px-3 text-right font-medium text-gray-600">
                    Amount Out
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-blue-100">
                {summaryData.map((row, idx) => (
                  <tr key={row.itemId} className="h-8 hover:bg-gray-50">
                    <td className=" text-gray-500 text-left px-3">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">
                          {row.itemName}
                        </span>
                        {row.itemCode && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white text-blue-700">
                            {row.itemCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 text-center text-gray-700">
                      {row.unit}
                    </td>
                    <td className="px-3 text-center font-mono">
                      {row.totalIn?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 text-center font-mono">
                      {row.totalOut?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 text-center font-mono">
                      ₹{row.amountIn?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 text-right font-mono font-semibold">
                      ₹{row.amountOut?.toLocaleString() ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom bar: compact pagination like the screenshot */}
        {pagination.totalPages > 0 && (
          <div className="border-t bg-gray-50 text-xs flex items-center justify-end px-3 py-1 gap-2">
            <span className="text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              -{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalItems
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">{pagination.totalItems}</span>
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="text-gray-600">
              {pagination.page}/{pagination.totalPages}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemSummaryPage;
