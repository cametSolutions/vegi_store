// src/components/Outstanding/OutstandingPartiesList.jsx
import React, { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { formatINR } from "../../../../../shared/utils/currency";
import ErrorDisplay from "@/components/errors/ErrorDisplay";
import { outstandingQueries } from "../../../hooks/queries/outstandingQueries";
import { accountMasterQueries } from "../../../hooks/queries/accountMaster.queries";

const OutstandingPartiesList = ({
  companyId,
  branchId,
  selectedParty,
  onSelectParty,
  fetchFullAccounts = false,
}) => {
  const listContainerRef = useRef(null);
  const selectedPartyRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Determine which query to run based on props
  const queryOptions = fetchFullAccounts
    ? accountMasterQueries.listWithOutstanding(
        companyId,
        branchId,
        null, // Default to customer if not specified, or pass as prop if needed
        currentPage,
        pageSize,
        debouncedSearchTerm
      )
    : outstandingQueries.partiesList(
        companyId,
        branchId,
        null,
        currentPage,
        pageSize,
        debouncedSearchTerm,
        "all"
      );

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...queryOptions,
    enabled: !!companyId && !!branchId,
    keepPreviousData: true, // Better UX during pagination
  });

  // Normalize data structure handling
  // If fetchFullAccounts is true, the structure matches the new controller (data.parties)
  // If false, it matches the original outstanding list structure
  const parties = data?.data?.parties || data?.data || [];
  
  // Handle summary safely (some endpoints might return it differently)
  const summary = data?.data?.summary || {};
  const totalPages = summary.totalPages || Math.ceil((summary.totalCount || 0) / pageSize) || 1;
  const totalCount = summary.totalParties || summary.totalCount || 0;

  useEffect(() => {
    // Auto-select first party if none selected
    if (!selectedParty && parties.length > 0) {
      onSelectParty(parties[0]);
    } else if (parties.length === 0) {
      onSelectParty(null);
    }
  }, [parties, selectedParty, onSelectParty]);

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
    // Handle both field names: totalOutstanding (new api) or just outstanding (old api)
    const amount = party.totalOutstanding ?? party.outstanding ?? 0;
    
    // Logic: Net > 0 is Receivable (DR), Net < 0 is Payable (CR)
    // The API returns absolute values for display, so we check netPositionType or raw val
    let isReceivable = true;
    
    if (party.netPositionType) {
        isReceivable = party.netPositionType === 'receivable';
    } else {
        // Fallback for APIs that might return signed numbers
        isReceivable = amount >= 0;
    }

    const absAmount = Math.abs(amount);

    return {
      displayAmount: formatINR(absAmount),
      amountClass: isReceivable ? "text-teal-600" : "text-rose-600",
      badge: isReceivable ? "DR" : "CR",
      badgeClass: isReceivable
        ? "bg-teal-50 text-teal-700 ring-1 ring-teal-100"
        : "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      icon: isReceivable ? (
        <ArrowDownLeft className="w-3 h-3 text-teal-500" />
      ) : (
        <ArrowUpRight className="w-3 h-3 text-rose-500" />
      ),
    };
  };

  const handlePreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="w-80 bg-white flex flex-col border-r border-slate-100 h-full font-sans text-sm border-b">
      {/* Header */}
      <div className="flex-none bg-white z-10 border-b border-slate-300">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">
              {fetchFullAccounts ? "Parties" : "Outstanding"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {fetchFullAccounts ? "Select party to view details" : "Payables & receivables"}
            </p>
          </div>
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="px-2 pb-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-200 border border-transparent focus:bg-white focus:border-sky-200 focus:ring-4 focus:ring-sky-50 rounded-sm text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none transition-all duration-200"
              disabled={isLoading || isError}
            />
          </div>
        </div>
      </div>

      {/* List Container */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        ref={listContainerRef}
      >
        {isError ? (
          <div className="h-full p-6">
            <ErrorDisplay
              error={error}
              onRetry={refetch}
              title="Error"
              variant="minimal"
            />
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 mt-10 text-slate-400">
            <Loader2 className="animate-spin w-6 h-6 mb-2 text-sky-500" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : parties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 mt-10 text-slate-400">
            <p className="text-sm">No parties found</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1 p-2">
            {parties.map((party) => {
              const displayInfo = getPartyDisplay(party);
              // Use partyId from new API or _id from old API
              const pId = party.partyId || party._id;
              const isSelected = selectedParty?.partyId === pId || selectedParty?._id === pId;

              return (
                <li
                  key={pId}
                  ref={isSelected ? selectedPartyRef : null}
                  onClick={() => onSelectParty(party)}
                  className={`group relative p-3 rounded-sm cursor-pointer transition-all duration-200  ${
                    isSelected
                      ? "bg-sky-100/80 border-sky-100 shadow-sm"
                      : "bg-white border hover:bg-slate-50 hover:border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 ">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {party.partyName || party.accountName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">
                          #{party.partyType || party.accountType}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        {displayInfo.icon}
                        <span
                          className={`text-sm font-bold tracking-tight ${displayInfo.amountClass}`}
                        >
                          {displayInfo.displayAmount}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${displayInfo.badgeClass}`}
                      >
                        {displayInfo.badge}
                      </span>
                    </div>
                  </div>
                  
                  {/* Optional: Show dual balance if both exist */}
                  {party.partyType === "both" && (
                     <div className="mt-3 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        Cust:{" "}
                        <span className="text-slate-600">
                          {formatINR(Math.abs(party.customerOutstanding || 0))}
                        </span>
                      </span>
                      <span className="text-slate-400">
                        Supp:{" "}
                        <span className="text-slate-600">
                          {formatINR(Math.abs(party.supplierOutstanding || 0))}
                        </span>
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none py-3 mb-1 px-4 bg-slate-50 border border-b-2 border-gray-300 rounded-b-sm shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-medium text-slate-500">
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={handleNextPage}
            disabled={
              currentPage === totalPages || totalPages === 0 || isLoading
            }
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutstandingPartiesList;
