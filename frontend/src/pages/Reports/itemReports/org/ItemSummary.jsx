// src/pages/ItemSummaryPage.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X, 
  Search, 
  Package, 
  Layers
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

const ItemSummaryPage = () => {
  const dispatch = useDispatch();

  const companyId = useSelector((state) => state.companyBranch?.selectedCompany._id);
  const branchId = useSelector((state) => state.companyBranch?.selectedBranch._id);
  const filters = useSelector((state) => state.filters);

  // Local state
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.TODAY);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  // Defaults
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

  const transactionType = filters.transactionType || "sale";
  const debouncedSearchTerm = useDebounce(search, 500);

  const queryOptions = itemMasterQueries.getItemSummary(companyId, branchId, {
    startDate: filters.startDate,
    endDate: filters.endDate,
    transactionType,
    search: debouncedSearchTerm,
    page: currentPage,
    limit,
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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

  // --- Configuration ---
  const isSale = transactionType === "sale";
  
  const config = {
    theme: isSale ? "emerald" : "blue",
    mainHeader: isSale ? "Sales" : "Purchase",
    returnHeader: isSale ? "Sales Return" : "Purchase Return",
    mainQtyKey: isSale ? "totalOut" : "totalIn",
    mainAmtKey: isSale ? "amountOut" : "amountIn",
    returnQtyKey: isSale ? "totalIn" : "totalOut",
    returnAmtKey: isSale ? "amountIn" : "amountOut",
    
    // Header Colors - darkened borders for better definition
    mainHeaderClass: isSale ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-blue-50 text-blue-700 border-blue-300",
    returnHeaderClass: "bg-orange-50 text-orange-700 border-orange-300",
  };

  // --- Strict Column Width Definition ---
  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: "50px" }} />  {/* # */}
      <col style={{ width: "250px" }} /> {/* Item */}
      <col style={{ width: "80px" }} />  {/* Unit */}
      <col style={{ width: "100px" }} /> {/* Main Qty */}
      <col style={{ width: "130px" }} /> {/* Main Amt */}
      <col style={{ width: "100px" }} /> {/* Return Qty */}
      <col style={{ width: "130px" }} /> {/* Return Amt */}
      <col style={{ width: "100px" }} /> {/* Closing Qty */}
      <col style={{ width: "140px" }} /> {/* Closing Val */}
    </colgroup>
  );

  return (
    <div className="flex flex-col bg-slate-100 h-[calc(100vh-101px)] overflow-hidden font-sans text-sm">
      
      {/* Header Section */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg border shadow-sm ${isSale ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                <Package className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-base font-bold text-slate-800">Item Summary</h1>
                <p className="text-xs text-slate-500 font-medium">Inventory movement analysis</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input
                type="text"
                placeholder="Search item name / code..."
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-1.5">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 h-full flex flex-col overflow-hidden relative">
          
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Loader2 className="animate-spin w-8 h-8 mb-2 text-sky-500" />
               <span className="text-xs font-medium">Loading items...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-sm mb-3">Unable to load item summary</p>
              <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
            </div>
          ) : summaryData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Layers className="w-10 h-10 mb-3 opacity-20" />
               <p className="text-sm font-medium">No items found for selected filters</p>
            </div>
          ) : (
            <>
              {/* Unified Scrollable Table Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <table className="w-full table-fixed border-collapse">
                  <TableColGroup />
                  <thead>
                    {/* Top Group Headers - Sticky Row 1 */}
                    <tr className="border-b border-slate-300">
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      <th className="sticky top-0 z-30 bg-slate-50 border-r border-slate-300"></th>
                      
                      {/* Dynamic Header 1 (Main) */}
                      <th colSpan={2} className={`sticky top-0 z-30 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider border-r border-white ${config.mainHeaderClass}`}>
                        {config.mainHeader}
                      </th>
                      
                      {/* Dynamic Header 2 (Return) */}
                      <th colSpan={2} className={`sticky top-0 z-30 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider border-r border-white ${config.returnHeaderClass}`}>
                        {config.returnHeader}
                      </th>

                      {/* Closing Section */}
                      <th colSpan={2} className="sticky top-0 z-30 py-1.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border-l border-slate-300">
                        Closing Balance
                      </th>
                    </tr>

                    {/* Sub Headers - Sticky Row 2 (Top offset = approx height of Row 1 ~29px) */}
                    <tr>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-center text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">#</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">Item</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-center text-[10px] font-semibold text-slate-600 uppercase border-r border-slate-300 bg-slate-100 border-b border-slate-300">Unit</th>
                      
                      {/* Main Cols */}
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-slate-50/95 border-r border-slate-300 border-b border-slate-300">Qty</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-slate-50/95 border-r border-slate-300 border-b border-slate-300">Amount</th>
                      
                      {/* Return Cols */}
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-orange-50/95 border-r border-slate-300 border-b border-slate-300">Qty</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase bg-orange-50/95 border-r border-slate-300 border-b border-slate-300">Amount</th>
                      
                      {/* Closing Cols */}
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-700 uppercase bg-slate-100 border-r border-slate-300 border-b border-slate-300">Qty</th>
                      <th className="sticky top-[29px] z-20 px-3 py-2 text-right text-[10px] font-semibold text-slate-700 uppercase bg-slate-100 border-b border-slate-300">Value</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {summaryData.map((row, idx) => (
                      <tr key={row.itemId} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-3 py-3 text-xs text-slate-500 text-center border-r border-slate-300">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="px-3 py-3 border-r border-slate-300">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-xs truncate" title={row.itemName}>{row.itemName}</span>
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
                        
                        {/* Main Transaction Data */}
                        <td className="px-3 py-3 text-right text-xs text-slate-700 font-mono tracking-tight bg-slate-50/30 border-r border-slate-300">
                          {row[config.mainQtyKey]?.toLocaleString() ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-semibold text-slate-800 font-mono tracking-tight bg-slate-50/30 border-r border-slate-300">
                          {row[config.mainAmtKey] ? formatINR(row[config.mainAmtKey]) : "-"}
                        </td>

                        {/* Return Transaction Data */}
                        <td className="px-3 py-3 text-right text-xs text-orange-600 font-mono tracking-tight bg-orange-50/5 border-r border-slate-300">
                          {row[config.returnQtyKey]?.toLocaleString() ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-medium text-orange-600 font-mono tracking-tight bg-orange-50/5 border-r border-slate-300">
                          {row[config.returnAmtKey] ? formatINR(row[config.returnAmtKey]) : "-"}
                        </td>

                         {/* Closing Data */}
                        <td className="px-3 py-3 text-right border-r border-slate-300 bg-slate-50/30">
                           <span className={`text-xs font-bold font-mono ${row.closingQuantity < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                             {row.closingQuantity?.toLocaleString() ?? 0}
                           </span>
                        </td>
                        <td className="px-3 py-3 text-right bg-slate-50/30">
                            <span className="text-xs font-bold text-slate-800 font-mono">
                                {formatINR(row.closingBalance ?? 0)}
                            </span>
                        </td>
                      </tr>
                    ))}
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

export default ItemSummaryPage;
