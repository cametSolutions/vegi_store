// src/pages/Outstanding/OutstandingSummary.jsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { DATE_FILTERS, getDateRange } from "../../../../../shared/utils/date";
import { outstandingQueries } from "../../../hooks/queries/outstandingQueries ";
import OutstandingPartiesList from "../outstandingReports/OutstandingPartiesList ";
import OutstandingTransactionsList from "../outstandingReports/OutstandingTransactionsList ";

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("all");

  // Pagination state for parties list (left side)
  const [partiesPage, setPartiesPage] = useState(1);
  const [partiesPageSize] = useState(5);

  // Pagination state for transactions (right side)
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize] = useState(10);

  const dateRange = customDateRange || getDateRange(dateFilter);

  // Debounce search term [web:24]
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPartiesPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated parties list
  const { data: partiesData, isLoading: isLoadingParties } = useQuery({
    ...outstandingQueries.partiesList(
      companyId,
      branchId,
      dateRange,
      partiesPage,
      partiesPageSize,
      debouncedSearchTerm,
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

  // Auto-select first party when parties list changes [web:30]
  useEffect(() => {
    if (parties.length > 0 && !selectedParty) {
      setSelectedParty(parties[0]);
    } else if (parties.length === 0) {
      setSelectedParty(null);
    }
  }, [parties]);

  // Reset transactions page when party or filters change [web:27][web:30]
  useEffect(() => {
    setTransactionsPage(1);
  }, [selectedParty?.partyId, outstandingTypeFilter]);

  // Reset parties page when filters change [web:30]
  useEffect(() => {
    setPartiesPage(1);
  }, [partyTypeFilter, dateFilter]);

  const handleDateFilterChange = (filterType) => {
    setDateFilter(filterType);
    if (filterType !== DATE_FILTERS.CUSTOM) {
      setCustomDateRange(null);
    }
    setTransactionsPage(1);
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

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSelectParty = (party) => {
    setSelectedParty(party);
    setTransactionsPage(1);
  };

  if (!companyId || !branchId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Please select a company and branch</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-99px)] flex bg-gray-50">
      <OutstandingPartiesList
        parties={parties}
        isLoading={isLoadingParties}
        selectedParty={selectedParty}
        onSelectParty={handleSelectParty}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        currentPage={partiesPage}
        totalPages={partiesTotalPages}
        totalCount={partiesTotalCount}
        pageSize={partiesPageSize}
        onPreviousPage={handlePartiesPreviousPage}
        onNextPage={handlePartiesNextPage}
      />

      <OutstandingTransactionsList
        selectedParty={selectedParty}
        transactions={transactions}
        isLoading={isLoadingDetails}
        totalOutstanding={totalOutstanding}
        currentPage={transactionsPage}
        totalPages={transactionsTotalPages}
        totalCount={transactionsTotalCount}
        pageSize={transactionsPageSize}
        onPreviousPage={handleTransactionsPreviousPage}
        onNextPage={handleTransactionsNextPage}
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        outstandingTypeFilter={outstandingTypeFilter}
        onOutstandingTypeFilterChange={setOutstandingTypeFilter}
        showFilterDropdown={showFilterDropdown}
        setShowFilterDropdown={setShowFilterDropdown}
      />
    </div>
  );
};

export default OutstandingSummary;
