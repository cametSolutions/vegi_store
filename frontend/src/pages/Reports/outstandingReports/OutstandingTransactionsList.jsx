// src/components/Outstanding/OutstandingTransactionsList.jsx
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

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

const OutstandingTransactionsList = ({
  companyId,
  branchId,
  selectedParty,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);

  // Redux filter keys (used only here, but stored globally for consistency)
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const startDate = filters.startDate;
  const endDate = filters.endDate;
  const outstandingTypeFilter = filters.outstandingType || "all";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Ensure defaults for this page
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
      outstandingTypeFilter, // "all" | "dr" | "cr"
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

  // Reset page when filters or selected party change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedParty?.partyId, outstandingTypeFilter, startDate, endDate]);

  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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

  const getOutstandingColor = (type) =>
    type === "dr" ? "text-green-600" : "text-red-600";

  const getOutstandingBadge = (type) =>
    type === "dr" ? (
      <span className="text-xs bg-green-100 text-red-700 px-2 py-0.5 rounded ml-1">
        DR
      </span>
    ) : (
      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-1">
        CR
      </span>
    );

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center px-3 py-3 bg-gray-50   shadow-sm border-b mb-1">
        {/* Header with party name only */}
        <div className="flex-none ">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-gray-900">
              {selectedParty?.partyName || "Select a Party"}
            </h1>
          </div>
        </div>
        {/* Filter bar only for transactions */}
        <div className=" flex justify-end">
          <FiltersBar
            showTransactionType={false}
            showDateFilter={true}
            showOutstandingType={true}
            // add showTransactionType if you later support it here
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onOutstandingTypeChange={handleOutstandingTypeChange}
            onPageReset={() => setCurrentPage(1)}
          />
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-hidden pb-2 ">
        <div className="bg-white shadow-sm h-full flex flex-col">
          {!selectedParty ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-500 text-sm">
                Select a party to view details
              </p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center flex-1 p-4">
              <ErrorDisplay
                error={error}
                onRetry={refetch}
                title="Failed to load transactions"
                fullHeight={true}
              />
            </div>
          ) : isLoading ? (
           <div className="flex items-center justify-center h-[calc(100vh-250px)]">
            <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
          </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-500 text-sm">No transactions found</p>
            </div>
          ) : (
            <>
              {/* Fixed Table Header */}
              <div className="flex-none ">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-300 border-b">
                    <tr>
                      <th
                        className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "50px" }}
                      >
                        #
                      </th>
                      <th
                        className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "120px" }}
                      >
                        Transaction No.
                      </th>
                      <th
                        className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "120px" }}
                      >
                        Date
                      </th>
                      <th
                        className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "130px" }}
                      >
                        Total Amount
                      </th>
                      <th
                        className="px-2 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "130px" }}
                      >
                        Paid Amount
                      </th>
                      <th
                        className=" py-3 px-4 text-end text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "150px" }}
                      >
                        Closing Balance
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Table Body */}
              <div className="flex-1 overflow-y-auto ">
                <table className="w-full table-fixed">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-blue-100 bg-blue-50 transition"
                      >
                        <td
                          className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 text-center"
                          style={{ width: "50px" }}
                        >
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td
                          className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 font-medium text-center"
                          style={{ width: "120px" }}
                        >
                          {transaction.transactionNumber || ""}
                        </td>
                        <td
                          className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 text-center"
                          style={{ width: "120px" }}
                        >
                          {transaction.transactionDate
                            ? formatDate(transaction.transactionDate)
                            : ""}
                        </td>
                        <td
                          className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 text-center font-semibold"
                          style={{ width: "130px" }}
                        >
                          {formatINR(transaction.totalAmount)}
                        </td>
                        <td
                          className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 text-center"
                          style={{ width: "130px" }}
                        >
                          {formatINR(transaction.paidAmount)}
                        </td>
                        <td
                          className="py-3  px-2 whitespace-nowrap text-xs text-center font-bold"
                          style={{ width: "150px" }}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span
                              className={getOutstandingColor(
                                transaction.outstandingType
                              )}
                            >
                              {formatINR(Math.abs(transaction.closingBalanceAmount))}
                            </span>
                            {getOutstandingBadge(transaction.outstandingType)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Fixed Table Footer (Total) */}
              <div className="flex-none border-t-2 ">
                <table className="w-full table-fixed">
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td style={{ width: "50px" }}></td>
                      <td style={{ width: "120px" }}></td>
                      <td style={{ width: "120px" }}></td>
                      <td style={{ width: "130px" }}></td>
                      <td
                        className="px-2 py-2 text-xs font-bold text-gray-900 text-center"
                        style={{ width: "130px" }}
                      >
                        Total Outstanding
                      </td>
                      <td
                        className="px-2 py-1.5 text-xs font-bold text-end pr-6 text-gray-900"
                        style={{ width: "150px" }}
                      >
                        <span>
                        {formatINR(Math.abs(totalOutstanding))}
                        </span>

                         <span>
                        {totalOutstanding >= 0
                          ? getOutstandingBadge("dr")
                          : getOutstandingBadge("cr")}
                        </span>
                       
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Fixed Footer with Pagination */}
              <div className="flex-none flex items-center justify-between px-1 py-3 border-t bg-gray-50">
                <div className="text-xs text-gray-700">
                  {totalCount > 0
                    ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(
                        currentPage * pageSize,
                        totalCount
                      )} of ${totalCount}`
                    : "Showing 0-0 of 0"}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading || isError}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-700 px-2">
                    {totalPages > 0
                      ? `${currentPage} / ${totalPages}`
                      : "0 / 0"}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={
                      currentPage === totalPages ||
                      totalPages === 0 ||
                      isLoading ||
                      isError
                    }
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
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
