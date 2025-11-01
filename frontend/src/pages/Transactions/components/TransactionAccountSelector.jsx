import React, { useState, useRef, useEffect, useCallback, use } from "react";
import { User, Search, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPartyLabel } from "../utils/transactionUtils";
import { useDebounce } from "../../../hooks/useDebounce";
import { accountMasterQueries } from "@/hooks/queries/accountMaster.queries";
import { priceLevelQueries } from "@/hooks/queries/priceLevel.queries";
import { truncate } from "../../../../../shared/utils/string";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "@/store/slices/loaderSlice";

/**
 * TransactionAccountSelector Component
 *
 * A sophisticated account selector with search autocomplete functionality.
 * Supports customer/party selection with real-time search and account type toggling.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.accountType - Type of account ("customer" or "cash")
 * @param {string} props.accountName - Selected account name
 * @param {number} props.openingBalance - Opening balance value
 * @param {string} props.account - Selected account ID
 * @param {string} props.priceLevel - Selected price level ID
 * @param {string} props.priceLevelName - Selected price level name
 * @param {Function} props.updateTransactionField - Updates single field
 * @param {Function} props.updateTransactionData - Updates multiple fields at once
 * @param {string} props.branch - Branch identifier
 * @param {string} props.company - Company identifier
 */
const TransactionAccountSelector = ({
  accountType,
  accountName,
  openingBalance,
  account,
  transactionType,
  priceLevel,
  priceLevelName,
  updateTransactionData,
  branch,
  company,
  modifyOnPriceLevelChange,
}) => {
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const RESULT_LIMIT = 25; // Maximum results to fetch per search
  const MIN_SEARCH_LENGTH = 2; // Minimum characters required to trigger search
  const DEBOUNCE_DELAY = 300; // Debounce delay in milliseconds
  const TRUNCATE_LENGTH = 30; // Max length for displayed account names
  const dispatch = useDispatch();

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
    !account
  );

  // ============================================================================
  // API QUERIES
  // ============================================================================
  // Query for customer search
  const crTransactionTypes = ["purchase", "credit_note"];
  const accountTypeForSearch = crTransactionTypes.includes(transactionType) ? "supplier" : "customer";
  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useQuery({
    ...accountMasterQueries.search(
      debouncedSearchTerm,
      company,
      branch,
      accountTypeForSearch,
      RESULT_LIMIT,
      {
        withOutstanding: true, // or false, or omit
      }
    ),
    enabled: isSearchEnabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: { success: false, count: 0, data: [] },
  });

  // Query for "Cash" account when "cash" is selected
  const { data: cashAccountResponse } = useQuery({
    ...accountMasterQueries.search("Cash", company, branch, "cash", 1,{
        withOutstanding: true, // or false, or omit
      }),
    enabled: !!(company && accountType === "cash" && !account),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (data) => data?.data?.[0], // Select first result
  });

  // Query for price levels - fetch once on initial load
  const {
    data: priceLevelsResponse,
    isLoading: isPriceLevelLoading,
    isError: isPriceLevelError,
    refetch: refetchPriceLevels,
  } = useQuery({
    ...priceLevelQueries.getAll(company, branch),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Extract data from API response
  const accounts = apiResponse?.data || [];
  const totalCount = apiResponse?.totalCount || 0;
  const hasMore = apiResponse?.hasMore || false;
  const isPriceLevelNeeded=transactionType === "sale" 

  // Extract price levels from API response and filter by branch
  const allPriceLevels = priceLevelsResponse?.data || [];
  const priceLevels = allPriceLevels.filter(
    (level) =>
      level.status === "active" &&
      (level.branches?.includes(branch) || level.branches?.length === 0)
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Set initial price level when price levels are fetched
   */
  useEffect(() => {
    if (priceLevels.length > 0 && !priceLevel) {
      const firstLevel = priceLevels[0];
      updateTransactionData({
        priceLevel: firstLevel._id,
        priceLevelName: firstLevel.priceLevelName,
      });
    }
  }, [priceLevels, priceLevel, updateTransactionData]);

  /**
   * Show error toast and provide retry option for price level fetch errors
   */
  useEffect(() => {
    if (isPriceLevelLoading) {
      dispatch(showLoader());
    } else {
      dispatch(hideLoader());
      if (isPriceLevelError) {
        toast.error("Failed to load price levels", {
          description: "Unable to fetch price levels. Please try again.",
          action: {
            label: "Retry",
            onClick: () => refetchPriceLevels(),
          },
          duration: 5000,
        });
      }
    }
  }, [isPriceLevelLoading, isPriceLevelError, refetchPriceLevels, dispatch]);

  /**
   * Auto-populate Cash account when "cash" is selected
   */
  useEffect(() => {
    if (accountType === "cash" && cashAccountResponse && !account && company) {
      const truncatedName = truncate(
        cashAccountResponse?.accountName,
        TRUNCATE_LENGTH
      );
      setSearchTerm(truncatedName);

      updateTransactionData({
        accountName: cashAccountResponse?.accountName,
        account: cashAccountResponse?._id,
        openingBalance: cashAccountResponse?.outstandingNet || 0,
        netAmount: 0,
        email: cashAccountResponse?.email || "",
        phone: cashAccountResponse?.phoneNo || "",
      });
    }
  }, [
    accountType,
    cashAccountResponse,
    account,
    company,
    updateTransactionData,
  ]);

  /**
   * Handle clicks outside dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideDropdown =
        dropdownRef.current && !dropdownRef?.current?.contains(e.target);
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
  // const handleInputChange = useCallback(
  //   (e) => {
  //     const value = e.target.value;
  //     setSearchTerm(value);
  //     setShowDropdown(true);
  //   },
  //   [updateTransactionData]
  // );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
  };

  /**
   * Handle account selection from dropdown
   * Updates transaction with selected account details
   */
  const handleSelectAccount = useCallback(
    (account) => {
      const truncatedName = truncate(account.accountName, TRUNCATE_LENGTH);
      setSearchTerm(truncatedName);

      // Find matching price level from customer's priceLevel field
      let selectedPriceLevel = priceLevel;
      let selectedPriceLevelName = priceLevelName;

      if (account.priceLevel && isPriceLevelNeeded) {
        const matchingLevel = priceLevels.find(
          (level) => level._id === account.priceLevel
        );

        if (matchingLevel) {
          selectedPriceLevel = matchingLevel._id;
          selectedPriceLevelName = matchingLevel.priceLevelName;
        }
      }

      updateTransactionData({
        accountName: account?.accountName,
        account: account?._id,
        openingBalance: account?.outstandingNet || 0,
        netAmount: 0,
        email: account?.email,
        phone: account?.phoneNo,
        priceLevel: selectedPriceLevel,
        priceLevelName: selectedPriceLevelName,
      });

      setShowDropdown(false);
    },
    [updateTransactionData, priceLevels, priceLevel, priceLevelName]
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
   * Handle account type change (customer/cash)
   */
  const handleAccountTypeChange = useCallback(
    (newType) => {
      updateTransactionData({
        accountType: newType,
        accountName: "",
        account: "",
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
      account: "",
      openingBalance: 0,
      netAmount: 0,
      email: "",
      phone: "",
    });
    setSearchTerm("");
  }, [updateTransactionData]);

  /**
   * Handle price level change
   */
  const handlePriceLevelChange = useCallback(
    (e) => {
      const selectedId = e.target.value;
      const selectedLevel = priceLevels.find(
        (level) => level._id === selectedId
      );

      updateTransactionData({
        priceLevel: selectedId,
        priceLevelName: selectedLevel?.priceLevelName || "",
      });
    },
    [updateTransactionData, priceLevels]
  );

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render input icon based on current state
   */
  const renderInputIcon = () => {
    if (isFetching && !account) {
      return (
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-blue-500" />
      );
    }

    if (account) {
      return (
        <X
          className="absolute mt-[1px] right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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
  return (
    <div className="grid grid-cols-5 gap-x-1 gap-y-2 bg-white px-3">
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
              value="cash"
              checked={accountType === "cash"}
              onChange={(e) => handleAccountTypeChange(e.target.value)}
              className="mr-1 text-blue-600 scale-75 cursor-pointer"
            />
            Other
          </label>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* ACCOUNT SEARCH (Only for Customer) */}
      {/* ====================================================================== */}
      <div className="relative">
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          Search {partyLabel}
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={accountType === "cash"}
            placeholder={`Search ${partyLabel.toLowerCase()} name`}
            className={`  ${
              accountType === "cash" ? "bg-slate-200" : ""
            }   w-full px-2 py-1 pr-7 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500`}
            autoComplete="off"
          />
          {renderInputIcon()}
        </div>

        {/* Dropdown with search results */}
        {showDropdown && searchTerm.length >= MIN_SEARCH_LENGTH && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-xs shadow-lg max-h-48 overflow-y-auto"
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
      {/* CUSTOMER/PARTY NAME (Display or Editable) */}
      {/* ====================================================================== */}
      <div>
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          {partyLabel} Name
        </label>
        <input
          type="text"
          value={accountName}
          onChange={(e) =>
            updateTransactionData({ accountName: e.target.value })
          }
          placeholder={`Enter ${partyLabel.toLowerCase()} name`}
          disabled={accountType === "customer"}
          className={`w-full px-2 py-1 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500 ${
            accountType === "customer" ? "bg-slate-200 " : ""
          }`}
        />
      </div>

      {/* ====================================================================== */}
      {/* OPENING BALANCE */}
      {/* ====================================================================== */}
      <div>
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          Opening Balance
        </label>
        <NumericFormat
          prefix="₹"
          thousandsGroupStyle="lakh"
          thousandSeparator=","
          value={openingBalance}
          disabled
          className={`w-full px-2 py-1 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500 bg-slate-200 
          `}
        />
      </div>

      {/* ====================================================================== */}
      {/* PRICE LEVEL */}
      {/* ====================================================================== */}
      <div>
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          Price Level
        </label>
        <select
          value={priceLevel || ""}
          disabled={!isPriceLevelNeeded}
          onChange={handlePriceLevelChange}
          className={` ${!isPriceLevelNeeded ? "bg-slate-200" : ""}  w-full px-2 py-1 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500
          
          `}
        >
          <option value="">Select price level</option>
          {priceLevels.map((level) => (
            <option key={level._id} value={level._id}>
              {level.priceLevelName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TransactionAccountSelector;
