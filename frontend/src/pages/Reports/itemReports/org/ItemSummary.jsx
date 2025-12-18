// src/pages/ItemSummaryPage.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";

import {
  DATE_FILTERS,
  getDateRange,
} from "../../../../../../shared/utils/date";
import { itemMasterQueries } from "@/hooks/queries/item.queries";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppliedFilters from "@/components/filters/appliedFilters/AppliedFilters";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { setFilter } from "@/store/slices/filtersSlice";
import { useDebounce } from "@/hooks/useDebounce";

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
  const limit = 15;

  // Ensure defaults only for this page on first mount
  useEffect(() => {
    if (!filters.transactionType) {
      dispatch(setFilter({ key: "transactionType", value: "sale" }));
    }

    if (!filters.startDate || !filters.endDate) {
      const range = getDateRange(DATE_FILTERS.TODAY);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.transactionType, filters.startDate, filters.endDate, dispatch]);

  const transactionType = filters.transactionType || undefined;
  const outstandingType = filters.outstandingType || undefined;

  const debouncedSearchTerm = useDebounce(search, 500);

  const queryOptions = itemMasterQueries.getItemSummary(companyId, branchId, {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    transactionType,
    outstandingType,
    search: debouncedSearchTerm || undefined,
    page: currentPage,
    limit,
  });

  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
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
    <div className="flex flex-col bg-white h-[calc(100vh-101px)] overflow-hidden">
      {/* Top bar: title + search + filters */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white shadow-sm">
        <h1 className="text-base font-semibold">Item Summary</h1>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search item name / code"
              className="h-8 text-xs w-52 pr-7" // 👈 padding for icon
              value={search}
              onChange={handleSearchChange}
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1); // optional
                }}
                className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2
                   text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* FiltersBar: no "all", default sale, date default TODAY */}
          <FiltersBar
            showDateFilter={true}
            showTransactionType={true}
            allowedTxnTypes={["sale", "purchase"]}
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
      <div className="mt-0 rounded-none flex-1 flex flex-col overflow-hidden">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center text-center py-20 h-[calc(100vh-200px)]">
            <p className="text-gray-500 text-sm font-semibold">
              !Oops..Error loading transactions
            </p>
            <button
              onClick={refetch}
              className="text-sm cursor-pointer font-semibold bg-blue-400 p-1 px-2 text-white rounded mt-2"
            >
              Retry
            </button>
          </div>
        ) : summaryData?.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm flex items-center justify-center font-bold h-[calc(100vh-200px)]">
            No data for selected filters.
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs table-fixed">
              <thead className="bg-gray-300 border-b sticky top-0 z-10">
                <tr className="h-10">
                  <th className="px-3 text-left font-medium text-gray-600 w-12">
                    #
                  </th>
                  <th className="px-3 text-left font-medium text-gray-600 w-[260px]">
                    Item
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600 w-20">
                    Unit
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600 w-24">
                    Qty In
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600 w-24">
                    Qty Out
                  </th>
                  <th className="px-3 text-center font-medium text-gray-600 w-28">
                    Amount In
                  </th>
                  <th className="px-3 text-right font-medium text-gray-600 w-28">
                    Amount Out
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 ">
                {summaryData.map((row, idx) => (
                  <tr key={row.itemId} className="h-12 bg-blue-50 hover:bg-blue-100">
                    <td className="px-3 text-gray-500 text-left">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900 truncate">
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
                    <td className="px-3 text-center ">
                      {row.totalIn?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 text-center ">
                      {row.totalOut?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 text-center ">
                      ₹{row.amountIn?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 text-right  font-semibold">
                      ₹{row.amountOut?.toLocaleString() ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom pagination bar (fixed to bottom of page section) */}
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
