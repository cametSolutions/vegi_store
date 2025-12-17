import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Filter, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatDate, DATE_FILTERS, getDateRange } from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { outstandingQueries } from "../../../hooks/queries/outstandingQueries ";
import DateFilter from "../../../components/DateFilterComponent/DateFilter";

const OutstandingSummary = () => {
  const selectedCompany = useSelector(
    (state) => state?.companyBranch?.selectedCompany
  );
  const selectedBranch = useSelector(
    (state) => state?.companyBranch?.selectedBranch
  );

  const companyId = selectedCompany?._id;
  const branchId = selectedBranch?._id;

  const [selectedParty, setSelectedParty] = useState(null);
  const [outstandingTypeFilter, setOutstandingTypeFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.THIS_MONTH);
  const [customDateRange, setCustomDateRange] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("all");
  
  // Pagination state for parties list (left side)
  const [partiesPage, setPartiesPage] = useState(1);
  const [partiesPageSize] = useState(20);
  
  // Pagination state for transactions (right side)
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize] = useState(20);

  const dateRange = customDateRange || getDateRange(dateFilter);

  // Fetch paginated parties list
  const { data: partiesData, isLoading: isLoadingParties } = useQuery({
    ...outstandingQueries.partiesList(
      companyId,
      branchId,
      dateRange,
      partiesPage,
      partiesPageSize,
      searchTerm,
      partyTypeFilter
    ),
  });

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    ...outstandingQueries.partyDetails(
      companyId,
      branchId,
      selectedParty?.partyId,
      outstandingTypeFilter,
      dateRange,
      transactionsPage,
      transactionsPageSize
    ),
    enabled: !!selectedParty,
  });

  const parties = partiesData?.data?.parties || [];
  const partiesTotalCount = partiesData?.data?.summary?.totalParties || 0;
  const partiesTotalPages = partiesData?.data?.summary?.totalPages || 0;
  
  const transactions = detailsData?.data?.transactions || [];
  const totalOutstanding = detailsData?.data?.totalOutstanding || 0;
  const transactionsTotalPages = detailsData?.data?.totalPages || 0;
  const transactionsTotalCount = detailsData?.data?.totalCount || 0;

  useEffect(() => {
    if (parties.length > 0 && !selectedParty) {
      setSelectedParty(parties[0]);
    }
  }, [parties]);

  // Reset when filters change
  useEffect(() => {
    setPartiesPage(1);
    setSelectedParty(null);
    setSearchTerm("");
  }, [partyTypeFilter]);

  // Reset transactions page when party or filters change
  useEffect(() => {
    setTransactionsPage(1);
  }, [selectedParty, outstandingTypeFilter, dateFilter]);

  const handleDateFilterChange = (filterType) => {
    setDateFilter(filterType);
    if (filterType !== DATE_FILTERS.CUSTOM) {
      setCustomDateRange(null);
    }
  };

  const handlePartiesPreviousPage = () => {
    setPartiesPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePartiesNextPage = () => {
    setPartiesPage((prev) => Math.min(prev + 1, partiesTotalPages));
  };

  const handleTransactionsPreviousPage = () => {
    setTransactionsPage((prev) => Math.max(prev - 1, 1));
  };

  const handleTransactionsNextPage = () => {
    setTransactionsPage((prev) => Math.min(prev + 1, transactionsTotalPages));
  };

  // Helper function to determine display info
  const getPartyDisplay = (party) => {
    const amount = party.totalOutstanding;
    const isReceivable = amount >= 0;
    const absAmount = Math.abs(amount);
    
    let typeBadge = '';
    let typeBadgeColor = '';
    
    if (party.partyType === 'both') {
      typeBadge = 'C+S';
      typeBadgeColor = 'bg-purple-100 text-purple-700';
    } else if (party.partyType === 'customer') {
      typeBadge = 'C';
      typeBadgeColor = 'bg-blue-100 text-blue-700';
    } else {
      typeBadge = 'S';
      typeBadgeColor = 'bg-orange-100 text-orange-700';
    }
    
    return {
      displayAmount: formatINR(absAmount),
      symbol: isReceivable ? "+" : "-",
      color: isReceivable ? "text-red-600" : "text-green-600",
      drCrBadge: isReceivable ? "DR" : "CR",
      drCrBadgeColor: isReceivable ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
      typeBadge,
      typeBadgeColor
    };
  };

  if (!companyId || !branchId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Please select a company and branch</p>
      </div>
    );
  }

  const getOutstandingColor = (type) => {
    return type === "dr" ? "text-red-600" : "text-green-600";
  };

  const getOutstandingBadge = (type) => {
    return type === "dr" ? (
      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-1">DR</span>
    ) : (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-1">CR</span>
    );
  };

  return (
    <div className="h-[calc(100vh-99px)] flex bg-gray-50">
      {/* Left Section - Party List (1/4 width) */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        {/* Header with Search and Filter */}
        <div className="flex-none p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900">Parties</h2>
            
            {/* Party Type Filter Dropdown */}
            {/* <div className="relative">
              <select
                value={partyTypeFilter}
                onChange={(e) => setPartyTypeFilter(e.target.value)}
                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="customer">Customers</option>
                <option value="supplier">Suppliers</option>
                <option value="both">Both (C+S)</option>
              </select>
            </div> */}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parties..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Party List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingParties ? (
            <div className="flex items-center justify-center h-full">
              <CustomMoonLoader />
            </div>
          ) : parties.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xs">
                {searchTerm ? "No parties found" : "No outstanding parties"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {parties.map((party) => {
                const displayInfo = getPartyDisplay(party);
                
                return (
                  <div
                    key={party.partyId}
                    onClick={() => setSelectedParty(party)}
                    className={`p-3 cursor-pointer transition hover:bg-gray-50 ${
                      selectedParty?.partyId === party.partyId
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Party Name and Type Badge */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {party.partyName}
                        </p>
                       
                      </div>

                      {/* Amount with DR/CR Badge on the same line */}
                      <div className="flex items-center gap-1">
                        <p className={`text-xs font-bold ${displayInfo.color}`}>
                          {displayInfo.symbol}{displayInfo.displayAmount}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${displayInfo.drCrBadgeColor}`}>
                          {displayInfo.drCrBadge}
                        </span>
                      </div>
                    </div>

                    {/* Show breakdown if party has both types */}
                    {party.partyType === 'both' && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-600">
                        <div className="flex justify-between">
                          <span>As Customer:</span>
                          <span className="text-red-600 font-semibold">
                            {formatINR(Math.abs(party.customerOutstanding))}
                          </span>
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span>As Supplier:</span>
                          <span className="text-green-600 font-semibold">
                            {formatINR(Math.abs(party.supplierOutstanding))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination for Parties List */}
        <div className="flex-none flex items-center justify-between px-3 py-2 border-t bg-gray-50">
          <div className="text-xs text-gray-700">
            {(partiesPage - 1) * partiesPageSize + 1}-{Math.min(partiesPage * partiesPageSize, partiesTotalCount)} of {partiesTotalCount}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePartiesPreviousPage}
              disabled={partiesPage === 1}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-700 px-2">
              {partiesPage} / {partiesTotalPages}
            </span>
            <button
              onClick={handlePartiesNextPage}
              disabled={partiesPage === partiesTotalPages}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Section - Transaction Details (3/4 width) */}
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
                onFilterChange={handleDateFilterChange}
              />

              {/* Outstanding Type Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
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
                        setOutstandingTypeFilter("all");
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
                        setOutstandingTypeFilter("dr");
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
                        setOutstandingTypeFilter("cr");
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
            ) : isLoadingDetails ? (
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
                            {(transactionsPage - 1) * transactionsPageSize + index + 1}
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
                            className={`px-2 py-1.5 whitespace-nowrap text-xs text-center font-bold`}
                            style={{ width: "150px" }}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className={getOutstandingColor(transaction.outstandingType)}>
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
                    Showing {(transactionsPage - 1) * transactionsPageSize + 1}-
                    {Math.min(transactionsPage * transactionsPageSize, transactionsTotalCount)} of {transactionsTotalCount}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleTransactionsPreviousPage}
                      disabled={transactionsPage === 1}
                      className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gray-700 px-2">
                      {transactionsPage} / {transactionsTotalPages}
                    </span>
                    <button
                      onClick={handleTransactionsNextPage}
                      disabled={transactionsPage === transactionsTotalPages}
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
    </div>
  );
};

export default OutstandingSummary;
