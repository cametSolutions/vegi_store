// src/components/Outstanding/OutstandingTransactionsList.jsx
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Loader2, ArrowUpRight, ArrowDownLeft, FileText, Calendar } from "lucide-react";

import {
  DATE_FILTERS,
  getDateRange,
  formatDate,
} from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import ErrorDisplay from "@/components/errors/ErrorDisplay";
import { outstandingQueries } from "../../../hooks/queries/outstandingQueries";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { setFilter } from "@/store/slices/filtersSlice";
import DownloadButton from "@/components/DownloadButton/DownloadButton";
import { useOutstandingDownload } from "@/hooks/downloadHooks/outstanding/useOutstandingDownload";
import SettlementModal from "@/components/modals/SettlementModal";


const OutstandingTransactionsList = ({
  companyId,
  branchId,
  selectedParty,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);

  // ✅ Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Redux filter keys
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const startDate = filters.startDate;
  const endDate = filters.endDate;
  const outstandingTypeFilter = filters.outstandingType || "all";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { initiateDownload, isDownloading, progress } = useOutstandingDownload();

  // Ensure defaults
  useEffect(() => {
    if (!filters.outstandingType) {
      dispatch(setFilter({ key: "outstandingType", value: "all" }));
    }
    if (!startDate || !endDate) {
      const range = getDateRange(DATE_FILTERS.THIS_MONTH);
      dispatch(
        setFilter({ key: "dateFilterKey", value: DATE_FILTERS.THIS_MONTH })
      );
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.outstandingType, startDate, endDate, dispatch]);

  const dateRange = { start: startDate, end: endDate };

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...outstandingQueries.partyDetails(
      companyId,
      branchId,
      selectedParty?.partyId,
      outstandingTypeFilter,
      dateRange,
      currentPage,
      pageSize
    ),
    enabled:
      !!companyId && !!branchId && !!selectedParty && !!startDate && !!endDate,
  });

  const transactions = data?.data?.transactions || [];
  const totalOutstanding = data?.data?.totalOutstanding || 0;
  const totalPages = data?.data?.totalPages || 0;
  const totalCount = data?.data?.totalCount || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedParty?.partyId, outstandingTypeFilter, startDate, endDate]);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleDateFilterChange = (key) => {
    const range = getDateRange(key);
    dispatch(setFilter({ key: "dateFilterKey", value: key }));
    dispatch(setFilter({ key: "startDate", value: range.start }));
    dispatch(setFilter({ key: "endDate", value: range.end }));
    setCurrentPage(1);
  };

  const handleOutstandingTypeChange = (value) => {
    dispatch(setFilter({ key: "outstandingType", value }));
    setCurrentPage(1);
  };

  const handleDownload = (format) => {
    if (!selectedParty) return;
    
    const downloadFilters = {
      company: companyId,
      branch: branchId,
      partyId: selectedParty.partyId,
      partyName: selectedParty.partyName,
      startDate: startDate,
      endDate: endDate,
      outstandingType: outstandingTypeFilter
    };
    
    initiateDownload(downloadFilters, format);
  };

  // ✅ Handle row click
  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const getOutstandingStyle = (type) => {
    const isDr = type === "dr";
    return {
      text: isDr ? "text-teal-600" : "text-rose-600",
      bg: isDr ? "bg-teal-50" : "bg-rose-50",
      border: isDr ? "border-teal-100" : "border-rose-100",
      badgeText: isDr ? "text-teal-700" : "text-rose-700",
      icon: isDr ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />
    };
  };

  const getTransactionTypeStyle = (type) => {
    switch (type) {
      case "sale":
        return { label: "Sale", className: "bg-blue-50 text-blue-700 border-blue-100" };
      case "purchase":
        return { label: "Purchase", className: "bg-purple-50 text-purple-700 border-purple-100" };
      case "sales_return":
        return { label: "Sales Ret", className: "bg-amber-50 text-amber-700 border-amber-100" };
      case "purchase_return":
        return { label: "Purch Ret", className: "bg-orange-50 text-orange-700 border-orange-100" };
      case "opening_balance":
        return { label: "Opening", className: "bg-gray-100 text-gray-700 border-gray-200" };
      case "advance_receipt":
        return { label: "Adv. Rect", className: "bg-green-50 text-green-700 border-green-100" };
      case "advance_payment":
        return { label: "Adv. Pay", className: "bg-indigo-50 text-indigo-700 border-indigo-100" };
      default:
        return { label: type?.replace("_", " ") || "-", className: "bg-slate-50 text-slate-600 border-slate-100" };
    }
  };

  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: "50px" }} />
      <col style={{ width: "100px" }} />
      <col style={{ width: "140px" }} />
      <col style={{ width: "110px" }} />
      <col style={{ width: "120px" }} />
      <col style={{ width: "120px" }} />
      <col style={{ width: "150px" }} />
    </colgroup>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/30 font-sans text-sm">
      
      {/* ✅ Settlement Modal */}
      <SettlementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
      />

      {/* Header Section */}
      <div className="flex-none bg-white border-b border-slate-100 px-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {selectedParty?.partyName || "Transaction Details"}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
              <FileText className="w-3 h-3" />
              <span>Statement of Accounts</span>
              {selectedParty && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="font-mono">#{selectedParty?.partyId?.toString().slice(-6)}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <DownloadButton 
              onDownload={handleDownload}
              isDownloading={isDownloading}
              progress={progress}
            />
            <FiltersBar
              showTransactionType={false}
              showDateFilter={true}
              showOutstandingType={true}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onOutstandingTypeChange={handleOutstandingTypeChange}
              onPageReset={() => setCurrentPage(1)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-2">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 h-full flex flex-col overflow-hidden relative">
          
          {!selectedParty ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a party to view transactions</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center flex-1 p-6">
              <ErrorDisplay
                error={error}
                onRetry={refetch}
                title="Failed to load data"
                variant="minimal"
              />
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2 text-sky-500" />
              <span className="text-xs">Loading ledger...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <Calendar className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No transactions found for this period</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                <table className="w-full table-fixed border-collapse">
                  <TableColGroup />
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-20 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">#</th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Type</th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Ref No.</th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Date</th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Total</th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-3 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Paid</th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-6 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Balance</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {transactions.map((transaction, index) => {
                      const styles = getOutstandingStyle(transaction.outstandingType);
                      const typeStyle = getTransactionTypeStyle(transaction.transactionType);
                      
                      return (
                        <tr
                          key={transaction._id}
                          onDoubleClick={() => handleRowClick(transaction)}
                          className="hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                        >
                          <td className="px-3 py-3.5 text-xs text-slate-400 text-center border-r border-slate-200">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-3 py-3.5 text-center border-r border-slate-200">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border capitalize whitespace-nowrap ${typeStyle.className}`}>
                              {typeStyle.label}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-xs font-medium text-slate-700 truncate border-r border-slate-200">
                            {transaction.transactionNumber || "-"}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600 border-r border-slate-200">
                            {transaction.transactionDate ? formatDate(transaction.transactionDate) : "-"}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600 text-right font-mono tracking-tight border-r border-slate-200">
                            {transaction.totalAmount ? formatINR(transaction.totalAmount) : "-"}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-slate-600 text-right font-mono tracking-tight border-r border-slate-200">
                            {transaction.paidAmount ? formatINR(transaction.paidAmount) : "-"}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-xs font-bold font-mono tracking-tight ${styles.text}`}>
                                {formatINR(Math.abs(transaction.closingBalanceAmount))}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${styles.bg} ${styles.badgeText} ${styles.border}`}>
                                {transaction.outstandingType === 'dr' ? 'DR' : 'CR'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex-none bg-slate-50 border-t border-slate-300 z-30">
                <table className="w-full table-fixed">
                  <TableColGroup />
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-xs font-bold text-slate-600 text-right uppercase tracking-wide border-slate-300">
                        Total Outstanding:
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <span className={`text-sm font-bold ${totalOutstanding >= 0 ? "text-teal-600" : "text-rose-600"}`}>
                            {formatINR(Math.abs(totalOutstanding))}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${totalOutstanding >= 0 ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800"}`}>
                            {totalOutstanding >= 0 ? "DR" : "CR"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex-none flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white z-40">
                <span className="text-[11px] font-medium text-slate-500">
                  Showing {totalCount > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)}` : "0"} of {totalCount} records
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-xs font-medium text-slate-600 px-3 bg-slate-50 py-1.5 rounded-md border border-slate-100 min-w-[3rem] text-center">
                    {totalPages > 0 ? `${currentPage} / ${totalPages}` : "1 / 1"}
                  </span>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutstandingTransactionsList;
