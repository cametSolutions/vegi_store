// src/components/Outstanding/AccountStatementDetail.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import {
  Loader2,
  FileText,
  Printer,
  Download,
  Receipt,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { formatINR } from "../../../../../../shared/utils/currency";
import {
  DATE_FILTERS,
  getDateRange,
} from "../../../../../../shared/utils/date";

// Components & Actions
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { Button } from "@/components/ui/button";
import { accountMasterQueries } from "@/hooks/queries/accountMaster.queries";
import { setFilter } from "@/store/slices/filtersSlice";
import DownloadButton from "@/components/DownloadButton/DownloadButton";
import { useReportDownload } from "@/hooks/downloadHooks/account/useSummaryDownload";

const AccountStatementDetail = ({ companyId, branchId, selectedParty }) => {
  const dispatch = useDispatch();

  // 1. Get Filters from Redux
  const filters = useSelector((state) => state.filters);
  const { initiateDownload, isDownloading, progress, status } = useReportDownload();


  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);

  // 2. Set Default Date Range
  useEffect(() => {
    if (!filters.startDate || !filters.endDate) {
      const range = getDateRange(DATE_FILTERS.THIS_MONTH);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.startDate, filters.endDate, dispatch]);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedParty?._id,
    selectedParty?.partyId,
    filters.startDate,
    filters.endDate,
  ]);

  // Handle account ID
  const accountId = selectedParty?.partyId || selectedParty?._id;

  // 3. Query
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...accountMasterQueries.getAccountStatement(
      filters.startDate,
      filters.endDate,
      companyId,
      branchId,
      accountId,
      null,
      currentPage,
      limit,
      ""
    ),
    enabled: !!companyId && !!branchId && !!accountId && !!filters.startDate,
    keepPreviousData: true,
  });

  const statementData = data?.items?.[0] || {};
  const transactions = statementData.transactions || [];
  const openingBalance = statementData.openingBalance || 0;

  const pagination = data?.pagination || {
    page: currentPage,
    limit: limit,
    totalItems: transactions.length,
    totalPages: 1,
  };

  // Group transactions
  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach((txn) => {
      const dateKey = format(new Date(txn.transactionDate), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(txn.transactionDate),
          txns: [],
          totalDr: 0,
          totalCr: 0,
        };
      }

      let dr = 0;
      let cr = 0;
      console.log(txn);

      const amount = Math.abs(txn.effectiveAmount || 0);

      console.log(amount);
      
      const type = txn.transactionType?.toLowerCase();

      const drTypes = ["sale", "purchase_return", "payment", "sales_payment"];
      const crTypes = [
        "purchase",
        "sales_return",
        "receipt",
        "purchase_receipt",
      ];

      if (drTypes.includes(type)) {
        dr = amount;
      } else if (crTypes.includes(type)) {
        cr = amount;
      } else {
        if (txn.ledgerSide === "debit") dr = amount;
        else cr = amount;
      }

      // console.log(amount, type);
      // console.log(dr, cr);

      groups[dateKey].txns.push({ ...txn, dr, cr });
      groups[dateKey].totalDr += dr;
      groups[dateKey].totalCr += cr;
    });

    return Object.values(groups).sort((a, b) => a.date - b.date);
  }, [transactions]);

  // console.log(groupedTransactions);

  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: "120px" }} />
      <col style={{ width: "350px" }} />
      <col style={{ width: "120px" }} />
      <col style={{ width: "120px" }} />
    </colgroup>
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };


  const handleDownload = async (format) => {
  if (!accountId) {
    toast.error("No party selected");
    return;
  }

  const downloadFilters = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    company: companyId,
    branch: branchId,
    account: accountId, // ✅ Single account for statement
    transactionType: filters.transactionType || null,
    searchTerm: filters.searchTerm || null,
  };

  await initiateDownload(downloadFilters, format,"statement");
};


  if (!selectedParty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50 border-l border-slate-200 text-slate-400">
        <Receipt className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium text-sm">Select a party to view statement</p>
      </div>
    );
  }





  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden font-sans text-sm">
      {/* Header Section */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border shadow-sm bg-indigo-50 border-indigo-100 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                {selectedParty.partyName || selectedParty.accountName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Account Statement
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
            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <FiltersBar
              showDateFilter={true}
              showTransactionType={false}
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
              <span className="text-xs font-medium">Loading statement...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p className="text-sm mb-3">Unable to load statement</p>
              <Button onClick={refetch} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 && openingBalance === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Layers className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                No transactions found for selected period
              </p>
            </div>
          ) : (
            <>
              {/* Scrollable Table Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <table className="w-full h-full table-fixed border-collapse">
                  <TableColGroup />
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <th className="sticky top-0 z-30 px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase border-r border-slate-300 bg-slate-50">
                        Date
                      </th>
                      <th className="sticky top-0 z-30 px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase border-r border-slate-300 bg-slate-50">
                        Narration
                      </th>
                      <th className="sticky top-0 z-30 px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase border-r border-slate-300 bg-slate-50">
                        Dr
                      </th>
                      <th className="sticky top-0 z-30 px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase bg-slate-50">
                        Cr
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {pagination.page === 1 && (
                      <tr className="bg-indigo-50/20 border-b border-slate-300">
                        <td
                          colSpan={2}
                          className="px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-tight border-r border-slate-300"
                        >
                          Opening Balance{" "}
                          <span className="text-[10px] text-slate-500 font-medium normal-case ml-2">
                            (as on{" "}
                            {format(
                              new Date(filters.startDate || new Date()),
                              "dd-MMM-yyyy"
                            )}
                            )
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-800 font-mono tracking-tight border-r border-slate-300 bg-indigo-50/10">
                          {openingBalance > 0
                            ? formatINR(Math.abs(openingBalance))
                            : "0"}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-800 font-mono tracking-tight bg-indigo-50/10">
                          {openingBalance < 0
                            ? formatINR(Math.abs(openingBalance))
                            : "0"}
                        </td>
                      </tr>
                    )}

                    {groupedTransactions.map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        {group.txns.map((txn, tIdx) => (
                          <tr
                            key={txn._id || tIdx}
                            className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-2.5 text-xs text-slate-500 font-medium border-r border-slate-300">
                              {tIdx === 0
                                ? format(group.date, "dd-MMM-yyyy")
                                : ""}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-700 font-medium border-r border-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="uppercase">
                                  {txn.transactionType === "sale"
                                    ? "By Sales"
                                    : txn.transactionType === "receipt"
                                    ? "By Receipt"
                                    : txn.transactionType === "purchase"
                                    ? "By Purchase"
                                    : txn.transactionType === "payment"
                                    ? "By Payment"
                                    : txn.transactionType === "sales_return"
                                    ? "By Sales Return"
                                    : txn.transactionType === "purchase_return"
                                    ? "By Purchase Return"
                                    : txn.transactionType}
                                </span>
                                {txn.transactionNumber && (
                                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded border border-slate-100">
                                    {txn.transactionNumber}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right text-xs text-slate-600 font-mono tracking-tight border-r border-slate-300">
                              {txn.dr > 0 ? formatINR(txn.dr) : "0"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-xs text-slate-600 font-mono tracking-tight">
                              {txn.cr > 0 ? formatINR(txn.cr) : "0"}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 border-t border-slate-200 border-b border-slate-300">
                          <td
                            colSpan={2}
                            className="px-4 py-2 text-right text-[11px] font-bold text-slate-500 uppercase tracking-tight border-r border-slate-300"
                          >
                            Total For {format(group.date, "dd-MMM-yyyy")}
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-bold text-slate-700 font-mono tracking-tight border-r border-slate-300 bg-slate-100/50">
                            {formatINR(group.totalDr)}
                          </td>
                          <td className="px-4 py-2 text-right text-xs font-bold text-slate-700 font-mono tracking-tight bg-slate-100/50">
                            {formatINR(group.totalCr)}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                    {/* Spacer row to push footer to bottom */}
                    <tr className="h-full border-none bg-white">
                      <td colSpan={4} className="p-0"></td>
                    </tr>
                  </tbody>
                  {(pagination.page === pagination.totalPages ||
                    pagination.totalPages === 0) && (
                    <tfoot>
                      {/* 1. Total Dr/Cr Row - Fixed above the Closing Balance */}
                      {/* We use bottom-[45px] because the row below it is approx 45px tall */}
                      <tr>
                        <td
                          colSpan={2}
                          className="sticky bottom-[45px] z-30 px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase tracking-tight border-r border-t-2 border-slate-300 bg-slate-50"
                        >
                          Total Amount
                        </td>
                        <td className="sticky bottom-[45px] z-30 px-4 py-2 text-right text-xs font-bold text-slate-700 font-mono tracking-tight border-r border-t-2 border-slate-300 bg-slate-50">
                          {statementData.summary?.totalDebit > 0
                            ? formatINR(statementData.summary.totalDebit)
                            : "0.00"}
                        </td>
                        <td className="sticky bottom-[45px] z-30 px-4 py-2 text-right text-xs font-bold text-slate-700 font-mono tracking-tight border-t-2 border-slate-300 bg-slate-50">
                          {statementData.summary?.totalCredit > 0
                            ? formatINR(statementData.summary.totalCredit)
                            : "0.00"}
                        </td>
                      </tr>

                      {/* 2. Total Closing Balance Row - Fixed at the very bottom */}
                      <tr>
                        <td
                          colSpan={2}
                          className="sticky bottom-0 z-30 px-4 py-3 text-right text-xs font-bold text-slate-800 uppercase tracking-tight border-r border-t border-slate-300 bg-indigo-50"
                        >
                          Total Closing Balance
                        </td>
                        <td className="sticky bottom-0 z-30 px-4 py-3 text-right text-sm font-bold text-indigo-700 font-mono tracking-tight border-r border-t border-slate-300 bg-indigo-50">
                          {statementData.summary?.closingBalance > 0
                            ? formatINR(
                                Math.abs(statementData.summary.closingBalance)
                              )
                            : "0.00"}
                        </td>
                        <td className="sticky bottom-0 z-30 px-4 py-3 text-right text-sm font-bold text-indigo-700 font-mono tracking-tight border-t border-slate-300 bg-indigo-50">
                          {statementData.summary?.closingBalance < 0
                            ? formatINR(
                                Math.abs(statementData.summary.closingBalance)
                              )
                            : "0.00"}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex-none px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between z-40">
                <span className="text-[11px] text-slate-500">
                  Showing page{" "}
                  <span className="font-medium text-slate-700">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {pagination.totalPages}
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
                    {pagination.page}
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

export default AccountStatementDetail;
