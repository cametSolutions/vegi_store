import React, { useState, useRef, useEffect, useCallback } from "react";
import { User, Search, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPartyLabel, useTransactionTotals } from "../utils/transactionUtils";
import { useDebounce } from "../../../hooks/useDebounce";
import { accountMasterQueries } from "@/hooks/queries/accountMaster.queries";
import { truncate } from "../../../../../shared/utils/string";

/**
 * TransactionAccountSelector Component
 *
 * A sophisticated account selector with search autocomplete functionality.
 * Supports customer/party selection with real-time search and account type toggling.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.accountType - Type of account ("customer" or "others")
 * @param {string} props.accountName - Selected account name
 * @param {number} props.openingBalance - Opening balance value
 * @param {string} props.accountId - Selected account ID
 * @param {Function} props.updateTransactionField - Updates single field
 * @param {Function} props.updateTransactionData - Updates multiple fields at once
 * @param {string} props.branch - Branch identifier
 * @param {string} props.company - Company identifier
 */
const TransactionAccountSelector = ({
  accountType,
  accountName,
  openingBalance,
  accountId,
  transactionType,

  updateTransactionData,
  branch,
  company,
}) => {
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const RESULT_LIMIT = 25; // Maximum results to fetch per search
  const MIN_SEARCH_LENGTH = 2; // Minimum characters required to trigger search
  const DEBOUNCE_DELAY = 300; // Debounce delay in milliseconds
  const TRUNCATE_LENGTH = 30; // Max length for displayed account names

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState(accountName || "");
  const [showDropdown, setShowDropdown] = useState(false);

  // ============================================================================
  // REFS
  // ============================================================================
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const partyLabel = getPartyLabel(transactionType);
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const isSearchEnabled = !!(
    company &&
    debouncedSearchTerm?.trim() &&
    debouncedSearchTerm.trim().length >= MIN_SEARCH_LENGTH &&
    accountType === "customer" &&
    !accountId
  );

  // ============================================================================
  // API QUERY
  // ============================================================================
  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useQuery({
    ...accountMasterQueries.search(
      debouncedSearchTerm,
      company,
      branch,
      "customer",
      RESULT_LIMIT
    ),
    enabled: isSearchEnabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: { success: false, count: 0, data: [] },
  });

  // Extract data from API response
  const accounts = apiResponse?.data || [];
  const totalCount = apiResponse?.totalCount || 0;
  const hasMore = apiResponse?.hasMore || false;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Handle clicks outside dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(e.target);
      const isOutsideInput =
        inputRef.current && !inputRef.current.contains(e.target);

      if (isOutsideDropdown && isOutsideInput) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle search input changes
   * Clears selected account when user types
   */
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setShowDropdown(true);
    },
    [updateTransactionData]
  );

  /**
   * Handle account selection from dropdown
   * Updates transaction with selected account details
   */
  const handleSelectAccount = useCallback(
    (account) => {
      const truncatedName = truncate(account.accountName, TRUNCATE_LENGTH);
      setSearchTerm(truncatedName);

      updateTransactionData({
        accountName: account.accountName,
        accountId: account._id,
        openingBalance: account.openingBalance || 0,
        netAmount: 0,
        email: account.email,
        phone: account.phoneNo,
      });

      setShowDropdown(false);
    },
    [updateTransactionData]
  );

  /**
   * Show dropdown when input is focused (if search term is valid)
   */
  const handleInputFocus = useCallback(() => {
    if (searchTerm.length >= MIN_SEARCH_LENGTH) {
      setShowDropdown(true);
    }
  }, [searchTerm]);

  /**
   * Handle account type change (customer/others)
   */
  const handleAccountTypeChange = useCallback(
    (newType) => {
      updateTransactionData({
        accountType: newType,
        accountName: "",
        accountId: "",
        openingBalance: 0,
        netAmount: 0,
        email: "",
        phone: "",
      });
      setSearchTerm("");
    },
    [updateTransactionData]
  );

  /**
   * Clear selected account
   */
  const handleClearAccount = useCallback(() => {
    updateTransactionData({
      accountType: "customer",
      accountName: "",
      accountId: "",
      openingBalance: 0,
      netAmount: 0,
      email: "",
      phone: "",
    });
    setSearchTerm("");
  }, [updateTransactionData]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render input icon based on current state
   */
  const renderInputIcon = () => {
    if (isFetching && !accountId) {
      return (
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-blue-500" />
      );
    }

    if (accountId) {
      return (
        <X
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer"
          onClick={handleClearAccount}
        />
      );
    }

    if (searchTerm.length >= MIN_SEARCH_LENGTH) {
      return (
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
      );
    }

    return null;
  };

  /**
   * Render dropdown content based on loading/data state
   */
  const renderDropdownContent = () => {
    if (isLoading) {
      return (
        <div className="px-3 py-2 text-[9px] text-slate-500 text-center">
          Searching...
        </div>
      );
    }

    if (accounts.length === 0) {
      return (
        <div className="text-[9px] text-slate-500 text-center">
          <p className="p-2">No {partyLabel.toLowerCase()}s found</p>
          <button
            onClick={() => setShowDropdown(false)}
            className="block w-full py-1 cursor-pointer text-blue-600 hover:text-blue-700 bg-gray-200"
          >
            + Create new {partyLabel.toLowerCase()}
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Result count header */}
        {totalCount > RESULT_LIMIT && (
          <div className="px-3 py-1.5 text-[8px] bg-blue-50 text-blue-700 border-b border-blue-100 sticky top-0 z-10">
            Showing {accounts.length} of {totalCount} results
            {hasMore && " - Type more to refine"}
          </div>
        )}

        {/* Account list */}
        {accounts.map((account) => (
          <div
            key={account._id}
            onClick={() => handleSelectAccount(account)}
            className="px-3 py-2 text-[9px] hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0"
          >
            <div className="font-medium text-slate-700">
              {truncate(account.accountName, TRUNCATE_LENGTH)}
            </div>
          </div>
        ))}

        {/* Footer hint for more results */}
        {hasMore && (
          <div className="px-3 py-1.5 text-[8px] text-slate-500 bg-slate-50 text-center border-t border-slate-200 sticky bottom-0 z-10">
            Can't find what you're looking for? Type more characters
          </div>
        )}
      </>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  const isDisabled = accountType === "others";
  const disabledClasses = isDisabled ? "opacity-50 pointer-events-none" : "";

  return (
    <div className="grid grid-cols-3 gap-x-1 gap-y-2 bg-white px-3">
      {/* ====================================================================== */}
      {/* ACCOUNT TYPE SELECTOR */}
      {/* ====================================================================== */}
      <div>
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          <User className="inline w-3 h-3 mr-1" />
          Party Type
        </label>
        <div className="flex gap-2 text-[10px] mt-2.5">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="customer"
              checked={accountType === "customer"}
              onChange={(e) => handleAccountTypeChange(e.target.value)}
              className="mr-1 text-blue-600 scale-75 cursor-pointer"
            />
            {partyLabel}
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="others"
              checked={accountType === "others"}
              onChange={(e) => handleAccountTypeChange(e.target.value)}
              className="mr-1 text-blue-600 scale-75 cursor-pointer"
            />
            Others
          </label>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* ACCOUNT NAME WITH AUTOCOMPLETE */}
      {/* ====================================================================== */}
      <div className={`relative ${disabledClasses}`}>
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          {partyLabel} Name
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={`Search ${partyLabel.toLowerCase()} name`}
            className="w-full px-2 py-1 pr-7 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            autoComplete="off"
          />
          {renderInputIcon()}
        </div>

        {/* Dropdown with search results */}
        {showDropdown && searchTerm.length >= MIN_SEARCH_LENGTH && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-48 overflow-y-auto"
          >
            {renderDropdownContent()}
          </div>
        )}

        {/* Helper text for minimum search length */}
        {searchTerm.length > 0 && searchTerm.length < MIN_SEARCH_LENGTH && (
          <div className="text-[8px] text-slate-500 mt-1">
            Type at least {MIN_SEARCH_LENGTH} characters to search
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* OPENING BALANCE */}
      {/* ====================================================================== */}
      <div className={disabledClasses}>
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          Opening Balance
        </label>
        <input
          type="number"
          value={openingBalance}
          disabled
          // onChange={(e) =>
          //   updateTransactionField(
          //     "openingBalance",
          //     parseFloat(e.target.value) || 0
          //   )
          // }
          className="w-full px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default TransactionAccountSelector;
