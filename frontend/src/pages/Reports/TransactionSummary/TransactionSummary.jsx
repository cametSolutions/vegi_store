import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { transactionSummaryQueries } from "../../../hooks/queries/transactionSummaryQueries ";
import { 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Search,
} from "lucide-react";
import { formatDate } from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import DateFilter, { DATE_FILTERS, getDateRange } from "../../../components/DateFilterComponent/DateFilter";

// Transaction type configuration
const TRANSACTION_CONFIG = {
  sale: {
    title: "Sales Summary",
    accountLabel: "Customer Name",
    color: "green",
  },
  purchase: {
    title: "Purchase Summary",
    accountLabel: "Supplier Name",
    color: "blue",
  },
  sales_return: {
    title: "Sales Return Summary",
    accountLabel: "Customer Name",
    color: "orange",
  },
  purchase_return: {
    title: "Purchase Return Summary",
    accountLabel: "Supplier Name",
    color: "purple",
  },
};

const TransactionSummary = () => {
  const { transactionType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const getTransactionTypeFromPath = () => {
    if (transactionType) return transactionType;
    
    const path = location.pathname;
    if (path.includes('sales-summary')) return 'sale';
    if (path.includes('purchase-summary')) return 'purchase';
    if (path.includes('sales-return-summary')) return 'sales_return';
    if (path.includes('purchase-return-summary')) return 'purchase_return';
    
    return null;
  };

  const actualTransactionType = getTransactionTypeFromPath();
  const config = actualTransactionType ? TRANSACTION_CONFIG[actualTransactionType] : null;

  const selectedCompany = useSelector(
    (state) => state?.companyBranch?.selectedCompany
  );
  const selectedBranch = useSelector(
    (state) => state?.companyBranch?.selectedBranch
  );

  const companyId = selectedCompany?._id;
  const branchId = selectedBranch?._id;

  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState(DATE_FILTERS.THIS_MONTH);

  const handleDateFilterChange = (filterType) => {
    setSelectedDateFilter(filterType);
    const { start, end } = getDateRange(filterType);
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Fetch transaction data using the query
  const { data, isLoading, isError, error, refetch } = useQuery(
    transactionSummaryQueries.summary(companyId, branchId, actualTransactionType, {
      page: currentPage,
      limit: pageSize,
      startDate,
      endDate,
      search: searchTerm,
    })
  );

  const transactions = data?.data?.transactions || [];
  const totalRecords = data?.data?.totalRecords || 0;
  const totalPages = data?.data?.totalPages || 0;
  const totalAmount = data?.data?.totalAmount || 0;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, searchTerm, pageSize, actualTransactionType]);

  useEffect(() => {
    handleDateFilterChange(DATE_FILTERS.THIS_MONTH);
  }, []);

  const handleManualDateChange = (field, value) => {
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setSelectedDateFilter(DATE_FILTERS.CUSTOM);
  };

  const handleExport = (type) => {
    console.log(`Exporting as ${type}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!companyId || !branchId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Please select a company and branch</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Invalid transaction type</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-35px)] flex flex-col bg-gray-50">
      {/* Fixed Header - No Scrolling */}
      <div className="flex-none bg-white shadow-sm border-b p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Bold Title */}
          <h1 className="text-xl font-extrabold text-gray-900 whitespace-nowrap">
            {config.title}
          </h1>

          {/* Right: All Filters in One Row */}
          <div className="flex items-center gap-2">
            {/* Date Filter Dropdown */}
            <DateFilter
              selectedFilter={selectedDateFilter}
              onFilterChange={handleDateFilterChange}
              buttonClassName="text-xs py-1"
            />
            
            {/* Custom Date Range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleManualDateChange('start', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleManualDateChange('end', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="border border-gray-300 rounded pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Summary Cards */}
     

      {/* Scrollable Table Area */}
      <div className="flex-1 px-2 pb-2 overflow-hidden">
        <div className="bg-white shadow-sm rounded-lg h-full flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <CustomMoonLoader />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <p className="text-red-500 text-sm mb-2">{error?.message}</p>
              <button
                onClick={() => refetch()}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-500 text-sm">No records found</p>
            </div>
          ) : (
            <>
              {/* Fixed Table Header */}
              <div className="flex-none">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Ref. No.
                      </th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        {config.accountLabel}
                      </th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Net Amount
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Table Body */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 w-12">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {transaction.transactionNumber}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {transaction.accountName}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900">
                          {transaction.phone || "-"}
                        </td>
                        <td className="px-2 py-1.5 text-xs text-gray-900">
                          <span className="truncate max-w-[150px] inline-block">
                            {transaction.email || "-"}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-900 text-right font-semibold">
                          {formatINR(transaction.netAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Fixed Table Footer (Total) */}
              <div className="flex-none border-t-2">
                <table className="w-full">
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan="6"
                        className="px-2 py-1.5 text-xs font-bold text-gray-900"
                      >
                        Total
                      </td>
                      <td className="px-2 py-1.5 text-xs font-bold text-gray-900 text-right">
                        {formatINR(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Fixed Footer with Action Buttons */}
              <div className="flex-none flex items-center justify-between px-2 py-1.5 border-t bg-gray-50">
                {/* Left: Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExport("excel")}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    <Download className="w-3 h-3" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    <Printer className="w-3 h-3" />
                    Print
                  </button>
                </div>

                {/* Center: Record Count */}
                <div className="text-xs text-gray-700">
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
                </div>

                {/* Right: Pagination */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-700 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
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

export default TransactionSummary;
