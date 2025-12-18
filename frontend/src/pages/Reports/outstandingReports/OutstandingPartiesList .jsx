// src/components/Outstanding/OutstandingPartiesList.jsx
import React, { useRef, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import ErrorDisplay from "@/components/errors/ErrorDisplay";

const OutstandingPartiesList = ({
  parties,
  isLoading,
  isError,
  error,
  onRetry,
  selectedParty,
  onSelectParty,
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPreviousPage,
  onNextPage,
}) => {
  const listContainerRef = useRef(null);
  const selectedPartyRef = useRef(null);

  // Scroll to selected party when it changes
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

    let typeBadge = "";
    let typeBadgeColor = "";

    if (party.partyType === "both") {
      typeBadge = "C+S";
      typeBadgeColor = "bg-purple-100 text-purple-700";
    } else if (party.partyType === "customer") {
      typeBadge = "C";
      typeBadgeColor = "bg-blue-100 text-blue-700";
    } else {
      typeBadge = "S";
      typeBadgeColor = "bg-orange-100 text-orange-700";
    }

    return {
      displayAmount: formatINR(absAmount),
      symbol: isReceivable ? "+" : "-",
      color: isReceivable ? "text-green-600" : "text-red-600",
      drCrBadge: isReceivable ? "DR" : "CR",
      drCrBadgeColor: isReceivable
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700",
      typeBadge,
      typeBadgeColor,
    };
  };

  return (
    <div className="w-1/4 bg-white border-r flex flex-col">
      {/* Header with Search */}
      <div className="flex-none p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-900">Parties</h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search parties..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || isError}
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Party List */}
      <div className="flex-1 overflow-y-auto" ref={listContainerRef}>
        {isError ? (
          <div className="h-full p-4">
            <ErrorDisplay
              error={error}
              onRetry={onRetry}
              title="Failed to load parties"
              fullHeight={true}
            />
          </div>
        ) : isLoading ? (
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
              const isSelected = selectedParty?.partyId === party.partyId;

              return (
                <div
                  key={party.partyId}
                  ref={isSelected ? selectedPartyRef : null}
                  onClick={() => onSelectParty(party)}
                  className={`p-3 cursor-pointer transition hover:bg-gray-50 ${
                    isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Party Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {party.partyName}
                      </p>
                    </div>

                    {/* Amount with DR/CR Badge */}
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

                  {/* Show breakdown if party has both types */}
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
      <div className="flex-none flex items-center justify-between px-3 py-2 border-t bg-gray-50">
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
            onClick={onPreviousPage}
            disabled={currentPage === 1 || isLoading || isError}
            className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-gray-700 px-2">
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : "0 / 0"}
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
    </div>
  );
};

export default OutstandingPartiesList;
