// src/components/Reports/TransactionSummary.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { transactionSummaryQueries } from "../../../hooks/queries/transactionSummaryQueries ";
import { transactionSummaryService } from "../../../api/services/transactionSummary.service ";
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  FileSpreadsheet,
  FileText,
  X,
  Loader2,
  FileBarChart,
  ShoppingBag,
  ShoppingCart,
  CornerUpLeft,
} from "lucide-react";
import {
  DATE_FILTERS,
  formatDate,
  getDateRange,
} from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { setFilter } from "@/store/slices/filtersSlice";
import { useDebounce } from "@/hooks/useDebounce";

import DownloadButton from "@/components/DownloadButton/DownloadButton";
import { useTransactionSummaryDownload } from "@/hooks/downloadHooks/transactions/useTransactionSummaryDownload";
import { useNavigate } from "react-router-dom";
import { addTransactionDataToStore } from "@/store/slices/transactionSlice";

// Transaction type configuration
const TRANSACTION_CONFIG = {
  sale: {
    label: "Sales Summary",
    accountLabel: "Customer Name",
    icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
    theme: "emerald",
  },
  purchase: {
    label: "Purchase Summary",
    accountLabel: "Supplier Name",
    icon: <ShoppingCart className="w-4 h-4 text-blue-500" />,
    theme: "blue",
  },
  sales_return: {
    label: "Sales Return",
    accountLabel: "Customer Name",
    icon: <CornerUpLeft className="w-4 h-4 text-orange-500" />,
    theme: "orange",
  },
  purchase_return: {
    label: "Purchase Return",
    accountLabel: "Supplier Name",
    icon: <CornerUpLeft className="w-4 h-4 text-purple-500" />,
    theme: "purple",
  },
};

const TransactionSummary = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const selectedCompany = useSelector(
    (state) => state?.companyBranch?.selectedCompany,
  );
  const selectedBranch = useSelector(
    (state) => state?.companyBranch?.selectedBranch,
  );
  const filters = useSelector((state) => state.filters);

  const companyId = selectedCompany?._id;
  const branchId = selectedBranch?._id;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- Download Hook Initialization ---
  const { initiateDownload, isDownloading, progress, status } =
    useTransactionSummaryDownload();

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      const { start, end } = getDateRange(dateFilter);
      // Option 1: Compare as strings (simplest)
      if (start === filters.startDate && end === filters.endDate) {
        return;
      }
      setDateFilter(DATE_FILTERS.CUSTOM);
    }

    if (!filters.transactionType) {
      dispatch(setFilter({ key: "transactionType", value: "sale" }));
    }
    if (!filters.startDate || !filters.endDate) {
      console.log("hai");

      const range = getDateRange(DATE_FILTERS.THIS_MONTH);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.transactionType, filters.startDate, filters.endDate, dispatch]);

  const transactionType = filters.transactionType || "sale";
  const config = TRANSACTION_CONFIG[transactionType] || TRANSACTION_CONFIG.sale;

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    transactionSummaryQueries.summary(companyId, branchId, transactionType, {
      page: currentPage,
      limit: pageSize,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: debouncedSearchTerm,
    }),
  );

  const transactions = data?.data?.transactions || [];
  const totalRecords = data?.data?.totalRecords || 0;
  const totalPages = data?.data?.totalPages || 0;
  const totalAmount = data?.data?.totalAmount || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.startDate,
    filters.endDate,
    debouncedSearchTerm,
    pageSize,
    transactionType,
  ]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleExport = async (type) => {
    if (!companyId || !branchId) {
      toast.error("Please select a company and branch");
      return;
    }
    setIsExporting(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: debouncedSearchTerm,
      };
      if (type === "excel") {
        await transactionSummaryService.exportToExcel(
          companyId,
          branchId,
          transactionType,
          params,
        );
        toast.success("Excel downloaded");
      } else if (type === "pdf") {
        await transactionSummaryService.exportToPDF(
          companyId,
          branchId,
          transactionType,
          params,
        );
        toast.success("PDF downloaded");
      }
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Download Handler ---
  const handleDownload = (format) => {
    const downloadFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      company: companyId,
      branch: branchId,
      transactionType: transactionType,
      searchTerm: debouncedSearchTerm || undefined,
    };
    initiateDownload(downloadFilters, format, "transaction-summary");
  };

  /// --handle edit navigation--
  const handleDoubleClick = (transaction) => {
    const reduxDataToPass = {
      isEditMode: true,
      editTransactionId: transaction._id,
      transactionType: transactionType,
    };
    dispatch(addTransactionDataToStore(reduxDataToPass));

    navigate(`/transactions/${transactionType}/create`, {
      state: {
        from: "transactionSummary",
        transactionId: transaction._id,
        fromPath: location.pathname,
      },
    });
  };

  // Define column widths for strict alignment
  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: "50px" }} /> {/* # */}
      <col style={{ width: "130px" }} /> {/* Ref No */}
      <col style={{ width: "100px" }} /> {/* Date */}
      <col style={{ width: "220px" }} /> {/* Account Name */}
      <col style={{ width: "130px" }} /> {/* Phone */}
      <col style={{ width: "180px" }} /> {/* Email */}
      <col style={{ width: "140px" }} /> {/* Net Amount */}
    </colgroup>
  );

  return (
    <div className="h-[calc(100vh-104px)] bg-slate-100 flex flex-col font-sans text-sm">
      {/* Fixed Header */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title Area */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shadow-sm">
              {config.icon}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">
                {config.label}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {totalRecords} records found
              </p>
            </div>
          </div>

          {/* Controls Area */}
          <div className="flex items-center gap-3">
            <DownloadButton
              onDownload={handleDownload}
              isDownloading={isDownloading}
              progress={progress}
              status={status}
            />
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input
                type="text"
                placeholder="Search party, ref..."
                className="h-9 text-sm w-64 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {isFetching && searchTerm && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <FiltersBar
              showDateFilter={true}
              showTransactionType={true}
              showOutstandingType={false}
              allowedTxnTypes={[
                "sale",
                "purchase",
                "sales_return",
                "purchase_return",
                "receipt",
                "payment",
                "stock_adjustment"

              ]}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onPageReset={() => setCurrentPage(1)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden py-1 px-2">
        <div className="bg-white rounded-sm shadow-sm border border-slate-300 h-full flex flex-col overflow-hidden relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2 text-sky-500" />
              <span className="text-xs font-medium">
                Loading transactions...
              </span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-sm mb-3">Unable to load data</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileBarChart className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {debouncedSearchTerm
                  ? `No results for "${debouncedSearchTerm}"`
                  : "No transactions found"}
              </p>
            </div>
          ) : (
            <>
              {/* Table Container (Header + Body) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                <table className="w-full table-fixed border-collapse">
                  <TableColGroup />
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        #
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        Ref No.
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        Date
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        {config.accountLabel}
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        Phone
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase border-r border-slate-300 border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        Email
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-50 px-6 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        Net Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-slate-50 transition-colors group"
                        onDoubleClick={() => handleDoubleClick(transaction)}
                      >
                        <td className="px-4 py-3 text-xs text-slate-400 text-center border-r border-slate-200">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700 truncate border-r border-slate-200 ">
                          {transaction.isCancelled ? (
                            <span className="line-through text-red-400">
                              {transaction.transactionNumber || "-"}
                            </span>
                          ) : (
                            <span>
                              {transaction.transactionNumber || "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 border-r border-slate-200">
                          {transaction.transactionDate
                            ? formatDate(transaction.transactionDate)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800 truncate border-r border-slate-200">
                          {transaction.accountName || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 border-r border-slate-200">
                          {transaction.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate border-r border-slate-200">
                          {transaction.email || "-"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-xs font-bold text-slate-700 font-mono tracking-tight group-hover:text-slate-900">
                            {/* {formatINR(transaction.netAmount)} */}
                            {transaction.isCancelled
                              ? <span className="text-red-500">Cancelled</span>
                              : formatINR(transaction.netAmount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Row - Fixed Position (Outside Table Scroll) */}
              <div className="flex-none bg-slate-50 border-t border-slate-300 z-30">
                <table className="w-full table-fixed">
                  <TableColGroup />
                  <tfoot>
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase   border-slate-300"
                      >
                        Total Amount:
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="bg-white border border-slate-300 rounded-md px-3 py-1.5 shadow-sm inline-block">
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            {formatINR(totalAmount)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination & Actions Footer (Fixed at page bottom) */}
              <div className="flex-none px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between z-40">
                <div></div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-slate-500">
                    Showing{" "}
                    <span className="font-medium text-slate-700">
                      {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalRecords)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-700">
                      {totalRecords}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-800"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-medium text-slate-600 min-w-[3rem] text-center border border-slate-200 rounded px-2 py-1 bg-slate-50">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-800"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;
