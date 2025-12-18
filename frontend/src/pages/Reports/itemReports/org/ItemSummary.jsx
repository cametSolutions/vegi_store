// src/pages/ItemSummaryPage.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DATE_FILTERS, getDateRange } from "../../../../../../shared/utils/date";
import { itemMasterQueries } from "@/hooks/queries/item.queries";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppliedFilters from "@/components/filters/appliedFilters/AppliedFilters";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { setFilter } from "@/store/slices/filtersSlice";


const ItemSummaryPage = () => {
  const dispatch = useDispatch();

  const companyId = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const branchId = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );
  const filters = useSelector((state) => state.filters);

  // per-page UI preset
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.TODAY);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 50;

  // 1) Ensure defaults only for this page on first mount
  useEffect(() => {
    // default txn type = "sale" for this page
    if (!filters.transactionType) {
      dispatch(setFilter({ key: "transactionType", value: "sale" }));
    }

    // default date = TODAY for this page (only if not already set)
    if (!filters.startDate || !filters.endDate) {
      const range = getDateRange(DATE_FILTERS.TODAY);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.transactionType, filters.startDate, filters.endDate, dispatch]);

  const transactionType = filters.transactionType || undefined;
  const outstandingType = filters.outstandingType || undefined;

  const queryOptions = itemMasterQueries.getItemSummary(companyId, branchId, {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    transactionType,
    outstandingType,
    search: search || undefined,
    page: currentPage,
    limit,
  }
  
);

  const { data, isLoading, isError, error } = useQuery({
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

  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar: title + search + filters */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <h1 className="text-base font-semibold">Item Summary</h1>

        <div className="flex items-center gap-2">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search item name / code"
            className="h-8 text-xs w-52"
            value={search}
            onChange={handleSearchChange}
          />

          {/* FiltersBar: no "all", default sale, date default TODAY */}
          <FiltersBar
            showDateFilter={true}
            showTransactionType={true}
            showOutstandingType={false}
            allowedTxnTypes={["sale", "purchase", "sales_return", "purchase_return"]}
            allowedOutstandingTypes={["receivables", "payables"]}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onPageReset={() => setCurrentPage(1)}
          />
        </div>
      </div>

      {/* Applied filters chips */}
      <AppliedFilters />

      {/* Table + bottom bar */}
      <div className="mt-0 rounded-none flex-1 flex flex-col">
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
                  <th className="px-3 text-left font-medium text-gray-600">Item</th>
                  <th className="px-3 text-center font-medium text-gray-600">Unit</th>
                  <th className="px-3 text-center font-medium text-gray-600">Qty In</th>
                  <th className="px-3 text-center font-medium text-gray-600">Qty Out</th>
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
                    <td className="text-gray-500 text-left px-3">
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

        {/* Bottom pagination bar */}
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
              of <span className="font-medium">{pagination.totalItems}</span>
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
