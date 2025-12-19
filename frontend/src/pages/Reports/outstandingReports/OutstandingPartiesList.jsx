// src/components/Outstanding/OutstandingPartiesList.jsx
import React, { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import ErrorDisplay from "@/components/errors/ErrorDisplay";
import { outstandingQueries } from "../../../hooks/queries/outstandingQueries";

const OutstandingPartiesList = ({
  companyId,
  branchId,
  selectedParty,
  onSelectParty,
}) => {
  const listContainerRef = useRef(null);
  const selectedPartyRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...outstandingQueries.partiesList(
      companyId,
      branchId,
      null, // no dateRange here
      currentPage,
      pageSize,
      debouncedSearchTerm,
      "all" // partyType filter if your API expects it
    ),
    enabled: !!companyId && !!branchId,
  });

  const parties = data?.data?.parties || [];
  const totalPages = data?.data?.summary?.totalPages || 0;
  const totalCount = data?.data?.summary?.totalParties || 0;

  // auto select first party if none selected
  useEffect(() => {
    if (!selectedParty && parties.length > 0) {
      onSelectParty(parties[0]);
    } else if (parties.length === 0) {
      onSelectParty(null);
    }
  }, [parties, selectedParty, onSelectParty]);

  // scroll selected party into view
  useEffect(() => {
    if (selectedPartyRef.current && listContainerRef.current) {
      selectedPartyRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [selectedParty?.partyId]);

  const getPartyDisplay = (party) => {
    const amount = party.totalOutstanding;
    const isReceivable = amount >= 0;
    const absAmount = Math.abs(amount);

    return {
      displayAmount: formatINR(absAmount),
      color: isReceivable ? "text-green-600" : "text-red-600",
      drCrBadge: isReceivable ? "DR" : "CR",
      drCrBadgeColor: isReceivable
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700",
    };
  };

  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="w-1/4 bg-white  flex flex-col border-r-4">
      {/* Header with Search */}
      <div className="flex-none p-5 border-b border-gray-900 bg-[#8da9c4] shadow-sm ">
        <div className="flex items-center justify-between ">
          <h2 className="text-sm font-bold ">Parties</h2>
        </div>

        {/* <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search parties..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border text-white border-gray-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || isError}
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white" />
        </div> */}
      </div>
        <div className="relative ">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search parties..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border-b border-gray-500  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || isError}
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 " />
        </div>

      {/* Party List */}
      <div className="flex-1 overflow-y-auto" ref={listContainerRef}>
        {isError ? (
          <div className="h-full p-4">
            <ErrorDisplay
              error={error}
              onRetry={refetch}
              title="Failed to load parties"
              fullHeight={true}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-250px)]">
            <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
          </div>
        ) : parties.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">
              {debouncedSearchTerm
                ? "No parties found"
                : "No outstanding parties found"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {parties.map((party) => {
              const displayInfo = getPartyDisplay(party);
              const isSelected = selectedParty?.partyId === party.partyId;

              return (
                <div
                  key={party.partyId}
                  ref={isSelected ? selectedPartyRef : null}
                  onClick={() => onSelectParty(party)}
                  className={`p-3 cursor-pointer transition border-b  ${
                    isSelected ? "bg-blue-200  border-l-4 border-blue-600" : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  <div className={ ` flex items-start justify-between gap-2`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {party.partyName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <p className={`text-xs font-bold ${displayInfo.color}`}>
                        {displayInfo.displayAmount}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${displayInfo.drCrBadgeColor}`}
                      >
                        {displayInfo.drCrBadge}
                      </span>
                    </div>
                  </div>

                  {party.partyType === "both" && (
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

      {/* Pagination */}
      <div className="flex-none flex items-center justify-between px-3 py-3 border-t bg-gray-50">
        <div className="text-xs text-gray-700">
          {totalCount > 0
            ? `${(currentPage - 1) * pageSize + 1}-${Math.min(
                currentPage * pageSize,
                totalCount
              )} of ${totalCount}`
            : "0 of 0"}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading || isError}
            className="p-1 border border-gray-600 bg-gray-500 rounded hover:bg-gray-600 text-white  disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-gray-700 px-2">
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : "0 / 0"}
          </span>
          <button
            onClick={handleNextPage}
            disabled={
              currentPage === totalPages ||
              totalPages === 0 ||
              isLoading ||
              isError
            }
            className="p-1 border border-gray-600 bg-gray-500 rounded hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutstandingPartiesList;
