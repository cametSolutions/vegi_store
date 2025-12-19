import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { transactionSummaryQueries } from "../../../hooks/queries/transactionSummaryQueries ";
import { transactionSummaryService } from "../../../api/services/transactionSummary.service ";
import { 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Search,
  FileSpreadsheet,
  FileText,
  X,
  LoaderCircle,
} from "lucide-react";
import { DATE_FILTERS, formatDate, getDateRange } from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppliedFilters from "@/components/filters/appliedFilters/AppliedFilters";
import FiltersBar from "@/components/filters/filterBar/FiltersBar";
import { setFilter } from "@/store/slices/filtersSlice";
import { useDebounce } from "@/hooks/useDebounce";

// Transaction type configuration
const TRANSACTION_CONFIG = {
  sale: {
    label: "Sales Summary",
    accountLabel: "Customer Name",
    color: "green",
  },
  purchase: {
    label: "Purchase Summary",
    accountLabel: "Supplier Name",
    color: "blue",
  },
  sales_return: {
    label: "Sales Return Summary",
    accountLabel: "Customer Name",
    color: "orange",
  },
  purchase_return: {
    label: "Purchase Return Summary",
    accountLabel: "Supplier Name",
    color: "purple",
  },
};

const TransactionSummary = () => {
  const dispatch = useDispatch();
  
  const selectedCompany = useSelector(
    (state) => state?.companyBranch?.selectedCompany
  );
  const selectedBranch = useSelector(
    (state) => state?.companyBranch?.selectedBranch
  );
  const filters = useSelector((state) => state.filters);

  const companyId = selectedCompany?._id;
  const branchId = selectedBranch?._id;

  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);

  // Debounce search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Initialize defaults on mount
  useEffect(() => {
    // Default transaction type = "sale" if not set
    if (!filters.transactionType) {
      dispatch(setFilter({ key: "transactionType", value: "sale" }));
    }

    // Default date = THIS_MONTH if not set
    if (!filters.startDate || !filters.endDate) {
      const range = getDateRange(DATE_FILTERS.THIS_MONTH);
      dispatch(setFilter({ key: "startDate", value: range.start }));
      dispatch(setFilter({ key: "endDate", value: range.end }));
    }
  }, [filters.transactionType, filters.startDate, filters.endDate, dispatch]);

  const transactionType = filters.transactionType || "sale";
  const config = TRANSACTION_CONFIG[transactionType];

  // Fetch transaction data using the query with debounced search
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery(
    transactionSummaryQueries.summary(companyId, branchId, transactionType, {
      page: currentPage,
      limit: pageSize,
      startDate: filters.startDate,
      endDate: filters.endDate,
      search: debouncedSearchTerm, // Use debounced value here
    })
  );

  const transactions = data?.data?.transactions || [];
  const totalRecords = data?.data?.totalRecords || 0;
  const totalPages = data?.data?.totalPages || 0;
  const totalAmount = data?.data?.totalAmount || 0;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.startDate, filters.endDate, debouncedSearchTerm, pageSize, transactionType]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
          params
        );
        toast.success("Excel file downloaded successfully");
      } else if (type === "pdf") {
        await transactionSummaryService.exportToPDF(
          companyId,
          branchId,
          transactionType,
          params
        );
        toast.success("PDF file downloaded successfully");
      }
    } catch (error) {
      toast.error(error.message || `Failed to export to ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
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
    <div className="h-[calc(100vh-109px)] flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="flex-none bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title */}
          <h1 className="text-base font-semibold text-gray-900">
            {config.label}
          </h1>

          {/* Right: Search + Filters */}
          <div className="flex items-center gap-2">
            {/* Search Bar with Clear Button */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by party, document..."
                className="h-8 text-xs w-64 pl-8 pr-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Show searching indicator */}
              {isFetching && searchTerm && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* FiltersBar */}
            <FiltersBar
              showDateFilter={true}
              showTransactionType={true}
              showOutstandingType={false}
              allowedTxnTypes={["sale", "purchase", "sales_return", "purchase_return"]}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onPageReset={() => setCurrentPage(1)}
            />
          </div>
        </div>
      </div>

      {/* Applied Filters */}
      <AppliedFilters />

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-hidden">
        <div className="bg-white shadow-sm h-full flex flex-col">
          {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-250px)]">
            <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
          </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <p className="text-gray-500 text-sm mb-2">!Oops...Unable to fetch data</p>
              <button
                onClick={() => refetch()}
                className=" text-sm px-3 py-1  bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <p className="text-gray-500 text-sm">
                {debouncedSearchTerm 
                  ? `No results found for "${debouncedSearchTerm}"`
                  : "No records found"}
              </p>
              {debouncedSearchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Fixed Table Header */}
              <div className="flex-none ">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-300 border-b">
                    <tr className="h-10">
                      <th className="px-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '50px'}}>
                        #
                      </th>
                      <th className="px-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '120px'}}>
                        Ref. No.
                      </th>
                      <th className="px-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '120px'}}>
                        Date
                      </th>
                      <th className="px-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '180px'}}>
                        {config.accountLabel}
                      </th>
                      <th className="px-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '130px'}}>
                        Phone
                      </th>
                      <th className="px-2 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '200px'}}>
                        Email
                      </th>
                      <th className="px-2 text-end pr-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider" style={{width: '130px'}}>
                        Net Amount
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Table Body */}
              <div className="flex-1 overflow-y-auto ">
                <table className="w-full table-fixed">
                  <tbody className="bg-blue-100 divide-y divide-gray-100">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction._id}
                        className="h-12 hover:bg-gray-50 transition"
                      >
                        <td className="px-2 whitespace-nowrap text-xs text-gray-500 text-center" style={{width: '50px'}}>
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-2 whitespace-nowrap text-xs text-gray-900 font-medium text-center" style={{width: '120px'}}>
                          {transaction.transactionNumber || ""}
                        </td>
                        <td className="px-2 whitespace-nowrap text-xs text-gray-900 text-center" style={{width: '120px'}}>
                          {transaction.transactionDate ? formatDate(transaction.transactionDate) : ""}
                        </td>
                        <td className="px-2 whitespace-nowrap text-xs text-gray-900 text-center" style={{width: '180px'}}>
                          {transaction.accountName || ""}
                        </td>
                        <td className="px-2 whitespace-nowrap text-xs text-gray-900 text-center" style={{width: '130px'}}>
                          {transaction.phone || ""}
                        </td>
                        <td className="px-2 text-xs text-gray-900 text-center truncate" style={{width: '200px'}}>
                          {transaction.email || ""}
                        </td>
                        <td className="px-2 pr-4 whitespace-nowrap text-xs text-gray-900 text-end font-semibold" style={{width: '130px'}}>
                          {formatINR(transaction.netAmount)}
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
                    <tr className="h-8">
                      <td style={{width: '50px'}}></td>
                      <td style={{width: '120px'}}></td>
                      <td style={{width: '120px'}}></td>
                      <td style={{width: '180px'}}></td>
                      <td style={{width: '130px'}}></td>
                      <td className="px-2 text-xs font-bold text-gray-900 text-center" style={{width: '200px'}}>
                        Total
                      </td>
                      <td className="px-2 text-xs  font-bold text-gray-900 text-end pr-4" style={{width: '130px'}}>
                        {formatINR(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Fixed Footer with Action Buttons */}
              <div className="flex-none flex items-center justify-between px-3 py-4 border-t bg-gray-50">
                {/* Left: Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("excel")}
                    disabled={isExporting}
                    className="h-7 text-xs  bg-green-500 text-white border rounded-sm"
                  >
                    {isExporting ? (
                      <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <FileSpreadsheet className="w-3 h-3 mr-1" />
                    )}
                    Excel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("pdf")}
                    disabled={isExporting}
                     className="h-7 text-xs  bg-red-500 text-white border rounded-sm"
                  >
                    {isExporting ? (
                      <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <FileText className="w-3 h-3 mr-1" />
                    )}
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrint}
                     className="h-7 text-xs  bg-blue-500 text-white border rounded-sm"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Center: Record Count */}
                  <div className="text-xs text-gray-600">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>
                    -
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalRecords)}
                    </span>{" "}
                    of <span className="font-medium">{totalRecords}</span>
                    {debouncedSearchTerm && (
                      <span className="ml-1 text-gray-500">
                        (filtered)
                      </span>
                    )}
                  </div>

                  {/* Right: Pagination */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs text-gray-600">
                      {currentPage}/{totalPages}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
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
