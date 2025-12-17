// src/components/Outstanding/OutstandingTransactionsList.jsx
import React from "react";
import {
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import DateFilter from "../../../components/DateFilterComponent/DateFilter";
import ErrorDisplay from "@/components/errors/ErrorDisplay";

const OutstandingTransactionsList = ({
  selectedParty,
  transactions,
  isLoading,
  isError,
  error,
  onRetry,
  totalOutstanding,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPreviousPage,
  onNextPage,
  dateFilter,
  onDateFilterChange,
  outstandingTypeFilter,
  onOutstandingTypeFilterChange,
  showFilterDropdown,
  setShowFilterDropdown,
}) => {
  const getOutstandingColor = (type) => {
    return type === "dr" ? "text-red-600" : "text-green-600";
  };

  const getOutstandingBadge = (type) => {
    return type === "dr" ? (
      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-1">
        DR
      </span>
    ) : (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-1">
        CR
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-none bg-white shadow-sm border-b p-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {selectedParty?.partyName || "Select a Party"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Filter */}
            <DateFilter
              selectedFilter={dateFilter}
              onFilterChange={onDateFilterChange}
              disabled={!selectedParty || isLoading || isError}
            />

            {/* Outstanding Type Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                disabled={!selectedParty || isLoading || isError}
                className="flex items-center gap-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Filter className="w-3.5 h-3.5" />
                Filter:{" "}
                {outstandingTypeFilter === "all"
                  ? "All"
                  : outstandingTypeFilter.toUpperCase()}
                <ChevronDown className="w-3 h-3" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                  <button
                    onClick={() => {
                      onOutstandingTypeFilterChange("all");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                      outstandingTypeFilter === "all"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : ""
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      onOutstandingTypeFilterChange("dr");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                      outstandingTypeFilter === "dr"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : ""
                    }`}
                  >
                    DR (Receivable)
                  </button>
                  <button
                    onClick={() => {
                      onOutstandingTypeFilterChange("cr");
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                      outstandingTypeFilter === "cr"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : ""
                    }`}
                  >
                    CR (Payable)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-hidden pb-2">
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
                onRetry={onRetry}
                title="Failed to load transactions"
                fullHeight={true}
              />
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <CustomMoonLoader />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-500 text-sm">No transactions found</p>
            </div>
          ) : (
            <>
              {/* Fixed Table Header */}
              <div className="flex-none px-2">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th
                        className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "50px" }}
                      >
                        #
                      </th>
                      <th
                        className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "120px" }}
                      >
                        Transaction No.
                      </th>
                      <th
                        className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "120px" }}
                      >
                        Date
                      </th>
                      <th
                        className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "130px" }}
                      >
                        Total Amount
                      </th>
                      <th
                        className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "130px" }}
                      >
                        Paid Amount
                      </th>
                      <th
                        className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                        style={{ width: "150px" }}
                      >
                        Closing Balance
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Table Body */}
              <div className="flex-1 overflow-y-auto px-2">
                <table className="w-full table-fixed">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td
                          className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 text-center"
                          style={{ width: "50px" }}
                        >
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td
                          className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 font-medium text-center"
                          style={{ width: "120px" }}
                        >
                          {transaction.transactionNumber || ""}
                        </td>
                        <td
                          className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 text-center"
                          style={{ width: "120px" }}
                        >
                          {transaction.transactionDate
                            ? formatDate(transaction.transactionDate)
                            : ""}
                        </td>
                        <td
                          className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 text-center font-semibold"
                          style={{ width: "130px" }}
                        >
                          {formatINR(transaction.totalAmount)}
                        </td>
                        <td
                          className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 text-center"
                          style={{ width: "130px" }}
                        >
                          {formatINR(transaction.paidAmount)}
                        </td>
                        <td
                          className="px-2 py-1.5 whitespace-nowrap text-xs text-center font-bold"
                          style={{ width: "150px" }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={getOutstandingColor(
                                transaction.outstandingType
                              )}
                            >
                              {formatINR(transaction.closingBalanceAmount)}
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
              <div className="flex-none border-t-2 px-2">
                <table className="w-full table-fixed">
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td style={{ width: "50px" }}></td>
                      <td style={{ width: "120px" }}></td>
                      <td style={{ width: "120px" }}></td>
                      <td style={{ width: "130px" }}></td>
                      <td
                        className="px-2 py-1.5 text-xs font-bold text-gray-900 text-center"
                        style={{ width: "130px" }}
                      >
                        Total Outstanding
                      </td>
                      <td
                        className="px-2 py-1.5 text-xs font-bold text-center text-gray-900"
                        style={{ width: "150px" }}
                      >
                        {formatINR(totalOutstanding)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Fixed Footer with Pagination */}
              <div className="flex-none flex items-center justify-between px-1 py-1 border-t bg-gray-50">
                <div className="text-xs text-gray-700">
                  Showing {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onPreviousPage}
                    disabled={currentPage === 1 || isLoading || isError}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={onNextPage}
                    disabled={currentPage === totalPages || totalPages === 0 || isLoading || isError}
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
