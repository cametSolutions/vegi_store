// src/pages/AccountSummaryPage.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X, 
  Search, 
  Users,
  Layers
} from "lucide-react";

import {
  DATE_FILTERS,
  getDateRange,
} from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";

import { Button } from "@/components/ui/button";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
// import DownloadButton from "@/components/DownloadButton"; // ← Import download button
import { setFilter } from "@/store/slices/filtersSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { accountMasterQueries } from "@/hooks/queries/accountMaster.queries";
// import { useReportDownload } from "@/hooks/useReportDownload"; // ← Import download hook
import DownloadButton from "@/components/DownloadButton/DownloadButton";
import { useReportDownload } from "@/hooks/downloadHooks/useReportDownload";

const AccountSummary = () => {
  const dispatch = useDispatch();

  const companyId = useSelector((state) => state.companyBranch?.selectedCompany._id);
  const branchId = useSelector((state) => state.companyBranch?.selectedBranch._id);
  const filters = useSelector((state) => state.filters);

  // Local state
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  // ← Download hook
  const { initiateDownload, isDownloading, progress, error } = useReportDownload();

  // Defaults
  useEffect(() => {
    if (!filters.transactionType) {
      dispatch(setFilter({ key: "transactionType", value: "sale" }));
    }
    if (!filters.startDate || !filters.endDate) {
      const range = getDateRange(DATE_FILTERS.THIS_MONTH);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.transactionType, filters.startDate, filters.endDate, dispatch]);

  const transactionType = filters.transactionType || "sale";
  const debouncedSearchTerm = useDebounce(search, 500);

  // --- Configuration ---
  const isSale = transactionType === "sale";

  const config = {
    theme: isSale ? "emerald" : "blue",
    mainHeader: isSale ? "Sales" : "Purchase",
    returnHeader: isSale ? "Sales Return" : "Purchase Return",
    mainAmtKey: isSale ? "sale" : "purchase",
    returnAmtKey: isSale ? "salesReturn" : "purchaseReturn",
    mainHeaderClass: isSale ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-blue-50 text-blue-700 border-blue-300",
    returnHeaderClass: "bg-orange-50 text-orange-700 border-orange-300",
    iconBg: isSale ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-blue-50 border-blue-100 text-blue-600"
  };

  // --- Query ---
  const queryOptions = accountMasterQueries.getAccountStatement(
    filters.startDate,
    filters.endDate,
    companyId,
    branchId,
    null,
    transactionType, 
    currentPage,
    limit,
    debouncedSearchTerm,
    true
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...queryOptions,
    enabled: !!companyId && !!branchId && !!filters.startDate,
    keepPreviousData: true,
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

  // ← Download handler
  const handleDownload = (format) => {
    const downloadFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      company: companyId,
      branch: branchId,
      transactionType: transactionType,
      searchTerm: debouncedSearchTerm || undefined,
    };

    
    
    initiateDownload(downloadFilters, format);
  };

  // --- Strict Column Width Definition ---
  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: "50px" }} />
      <col style={{ width: "250px" }} />
      <col style={{ width: "200px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
      <col style={{ width: "150px" }} />
    </colgroup>
  );

  return (
    <div className="flex flex-col bg-slate-100 h-[calc(100vh-101px)] overflow-hidden font-sans text-sm">

      {/* Header Section */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg border shadow-sm ${config.iconBg}`}>
                <Users className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-base font-bold text-slate-800">Account Summary</h1>
                <p className="text-xs text-slate-500 font-medium">Customer & Vendor Ledger Analysis</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input
                type="text"
                placeholder="Search account..."
                className="h-9 text-sm w-60 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
                value={search}
                onChange={handleSearchChange}
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
             <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            {/* ← Download Button */}
            <DownloadButton 
              onDownload={handleDownload}
              formats={['excel', 'pdf']}
              disabled={isDownloading || isLoading}
            />
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            <FiltersBar
              showDateFilter={true}
              showTransactionType={true}
              allowedTxnTypes={["sale", "purchase"]}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onPageReset={() => setCurrentPage(1)}
            />
          </div>
        </div>

        {/* ← Download Progress Indicator */}
        {isDownloading && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin w-4 h-4 text-indigo-600" />
              <div className="flex-1">
                <span className="text-xs text-indigo-700 font-medium">
                  Generating report... {progress}%
                </span>
                <div className="mt-1.5 w-full bg-indigo-200 rounded-full h-1.5">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ← Download Error */}
        {error && !isDownloading && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-1.5">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 h-full flex flex-col overflow-hidden relative">

          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Loader2 className="animate-spin w-8 h-8 mb-2 text-sky-500" />
               <span className="text-xs font-medium">Loading accounts...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-sm mb-3">Unable to load account summary</p>
              <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
            </div>
          ) : summaryData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Layers className="w-10 h-10 mb-3 opacity-20" />
               <p className="text-sm font-medium">No accounts found for selected filters</p>
            </div>
          ) : (
            <>
              {/* Unified Scrollable Table Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <table className="w-full table-fixed border-collapse">
                  <TableColGroup />
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      <th className={`sticky top-0 z-30 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider border-r border-white ${config.mainHeaderClass}`}>
                        {config.mainHeader}
                      </th>
                      <th className={`sticky top-0 z-30 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider ${config.returnHeaderClass}`}>
                        {config.returnHeader}
                      </th>
                    </tr>

                    <tr>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-center text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">#</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">Account Name</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">Email</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">phoneNo</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-slate-50/95 border-r border-slate-300 border-b border-slate-300">Total Amount</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-orange-50/95 border-b border-slate-300">Total Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {summaryData.map((row, idx) => {
                      const mainAmount = row.summary?.breakdown?.[config.mainAmtKey] || 0;
                      const returnAmount = row.summary?.breakdown?.[config.returnAmtKey] || 0;

                      return (
                        <tr key={row.accountId} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-3 py-3 text-xs text-slate-500 text-center border-r border-slate-300">
                            {(pagination.page - 1) * pagination.limit + idx + 1}
                          </td>
                          <td className="px-3 py-3 border-r border-slate-300">
                            <span className="font-semibold text-slate-700 text-xs block truncate" title={row.accountName}>
                              {row.accountName}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-slate-300">
                            {row.email ? (
                              <span className="text-xs text-slate-600 block truncate" title={row.email}>
                                {row.email}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 italic">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 border-r border-slate-300">
                            {row.phoneNo ? (
                              <span className="text-xs text-slate-600 font-mono block truncate" title={row.phoneNo}>
                                {row.phoneNo}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 italic">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-xs font-semibold text-slate-800 font-mono tracking-tight bg-slate-50/30 border-r border-slate-300">
                            {mainAmount ? formatINR(mainAmount) : "-"}
                          </td>
                          <td className="px-3 py-3 text-right text-xs font-medium text-orange-600 font-mono tracking-tight bg-orange-50/5">
                            {returnAmount ? formatINR(returnAmount) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex-none px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between z-40">
                 <span className="text-[11px] text-slate-500">
                    Showing <span className="font-medium text-slate-700">{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalItems)}</span> of <span className="font-medium text-slate-700">{pagination.totalItems}</span>
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

export default AccountSummary;
