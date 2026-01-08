// src/pages/StockRegister.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Search,
  ClipboardList,
  Layers,
} from "lucide-react";

import {
  DATE_FILTERS,
  getDateRange,
} from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";
import { itemMasterQueries } from "@/hooks/queries/item.queries";

import { Button } from "@/components/ui/button";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { setFilter } from "@/store/slices/filtersSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { useReportDownload } from "@/hooks/downloadHooks/item/useItemSummaryDownload";
import DownloadButton from "@/components/DownloadButton/DownloadButton";

const StockRegister = () => {
  const dispatch = useDispatch();

  const companyId = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const branchId = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );
  const filters = useSelector((state) => state.filters);

  // Local state
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  // Defaults - Force Stock Mode (clear transactionType)
  useEffect(() => {
    // Always clear transactionType to trigger "Stock Register" mode in backend
    if (filters.transactionType !== null) {
      dispatch(setFilter({ key: "transactionType", value: null }));
    }

    // Default Date Range
    if (!filters.startDate || !filters.endDate) {
      const range = getDateRange(DATE_FILTERS.THIS_MONTH);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.transactionType, filters.startDate, filters.endDate, dispatch]);

  const debouncedSearchTerm = useDebounce(search, 500);

  // Query - passes transactionType: null for Stock Mode
  const queryOptions = itemMasterQueries.getItemSummary(companyId, branchId, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    transactionType: null, // Explicitly null for stock register
    search: debouncedSearchTerm,
    page: currentPage,
    limit,
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...queryOptions,
    enabled:
      !!companyId && !!branchId && !!filters.startDate && !!filters.endDate,
  });

  // ← Download hook
  const { initiateDownload, isDownloading, progress, error, status } =
    useReportDownload();

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

  // ← Download handler
  const handleDownload = (format) => {
    const downloadFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      company: companyId,
      branch: branchId,
      transactionType: null,
      searchTerm: debouncedSearchTerm || undefined,
    };

    // console.log(downloadFilters);

    initiateDownload(downloadFilters, format, "stock-register");
  };

  // --- Column Configuration ---
  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: "50px" }} /> {/* # */}
      <col style={{ width: "250px" }} /> {/* Item */}
      <col style={{ width: "80px" }} /> {/* Unit */}
      <col style={{ width: "100px" }} /> {/* Opening */}
      <col style={{ width: "100px" }} /> {/* In-ward */}
      <col style={{ width: "100px" }} /> {/* Out-ward */}
      <col style={{ width: "100px" }} /> {/* Closing Qty */}
      <col style={{ width: "100px" }} /> {/* Closing Rate */}
      <col style={{ width: "120px" }} /> {/* Closing Amt */}
    </colgroup>
  );

  return (
    <div className="flex flex-col bg-slate-100 h-[calc(100vh-103px)] overflow-hidden font-sans text-sm">
      {/* Header Section */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border shadow-sm bg-indigo-50 border-indigo-100 text-indigo-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">
                Stock Register
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Detailed inventory tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ← Download Button */}
            <DownloadButton
              onDownload={handleDownload}
              isDownloading={isDownloading}
              progress={progress}
              status={status} // Optional: Pass this if you want the Check/X icons to appear
            />

            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search item name / code..."
                className="h-9 text-sm w-60 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                value={search}
                onChange={handleSearchChange}
              />

              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            {/* Filter Bar with Transaction Type Hidden */}
            <FiltersBar
              showDateFilter={true}
              showTransactionType={false} // Hidden for Stock Register
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onPageReset={() => setCurrentPage(1)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-1.5">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 h-full flex flex-col overflow-hidden relative">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2 text-indigo-500" />
              <span className="text-xs font-medium">
                Loading stock register...
              </span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-sm mb-3">Unable to load stock data</p>
              <Button onClick={refetch} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          ) : summaryData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Layers className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                No items found for selected period
              </p>
            </div>
          ) : (
            <>
              {/* Unified Scrollable Table Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <table className="w-full table-fixed border-collapse">
                  <TableColGroup />
                  <thead>
                    {/* 
                       Complex Header with RowSpans 
                       Sticky positioning requires z-index management
                    */}
                    <tr className="border-b border-slate-300 bg-slate-50">
                      {/* Fixed Columns (RowSpan 2) */}
                      <th
                        rowSpan={2}
                        className="sticky top-0 z-30 px-3 py-2 text-center text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-50 align-middle"
                      >
                        #
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 z-30 px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-50 align-middle"
                      >
                        Item Name
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 z-30 px-3 py-2 text-center text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-50 align-middle"
                      >
                        Unit
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 z-30 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-50 align-middle"
                      >
                        Opening
                        <br />
                        Quantity
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 z-30 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-50 align-middle"
                      >
                        In-ward
                        <br />
                        Quantity
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 z-30 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-50 align-middle"
                      >
                        Out-ward
                        <br />
                        Quantity
                      </th>

                      {/* Grouped Header (ColSpan 3) */}
                      <th
                        colSpan={3}
                        className="sticky top-0 z-30 py-1.5 text-center text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-300 bg-indigo-50/50"
                      >
                        Closing Balance
                      </th>
                    </tr>

                    {/* Sub-Header Row */}
                    <tr className="border-b border-slate-300">
                      {/* These columns are pushed by rowSpan above, so we only define the Closing sub-cols */}
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-indigo-50/30 border-l border-slate-300">
                        Quantity
                      </th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-indigo-50/30">
                        Rate
                      </th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-indigo-50/30">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {summaryData.map((row, idx) => (
                      <tr
                        key={row.itemId}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-3 py-3 text-xs text-slate-500 text-center border-r border-slate-300">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="px-3 py-3 border-r border-slate-300">
                          <div className="flex flex-col">
                            <span
                              className="font-semibold text-slate-700 text-xs truncate"
                              title={row.itemName}
                            >
                              {row.itemName}
                            </span>
                            {row.itemCode && (
                              <div className="flex mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Code: {row.itemCode}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-500 border-r border-slate-300">
                          <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                            {row.unit}
                          </span>
                        </td>

                        {/* Opening */}
                        <td className="px-3 py-3 text-right text-xs text-slate-600 font-mono tracking-tight border-r border-slate-300">
                          {row.openingQuantity?.toLocaleString() ?? 0}
                        </td>

                        {/* In-ward */}
                        <td className="px-3 py-3 text-right text-xs text-emerald-600 font-mono tracking-tight bg-emerald-50/5 border-r border-slate-300">
                          {row.totalIn?.toLocaleString() ?? 0}
                        </td>

                        {/* Out-ward */}
                        <td className="px-3 py-3 text-right text-xs text-orange-600 font-mono tracking-tight bg-orange-50/5 border-r border-slate-300">
                          {row.totalOut?.toLocaleString() ?? 0}
                        </td>

                        {/* Closing Balance Section */}
                        <td className="px-3 py-3 text-right text-xs font-semibold text-indigo-700 font-mono tracking-tight bg-indigo-50/5 border-r border-slate-300">
                          {row.closingQuantity?.toLocaleString() ?? 0}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-slate-600 font-mono tracking-tight bg-indigo-50/5 border-r border-slate-300">
                          {row.lastPurchaseRate
                            ? formatINR(row.lastPurchaseRate)
                            : "-"}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-semibold text-slate-800 font-mono tracking-tight bg-indigo-50/5">
                          {row.closingBalance
                            ? formatINR(row.closingBalance)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex-none px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between z-40">
                <span className="text-[11px] text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalItems
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {pagination.totalItems}
                  </span>
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-800"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium text-slate-600 min-w-[3rem] text-center border border-slate-200 rounded px-2 py-1 bg-slate-50">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-800"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockRegister;
