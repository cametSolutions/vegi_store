import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../../../hooks/useDebounce";
import { accountMasterQueries } from "@/hooks/queries/accountMaster.queries";
import { truncate } from "../../../../../shared/utils/string";
import { NumericFormat } from "react-number-format";

const CashTransactionAccountSelector = ({
  accountName,
  account,
  previousBalanceAmount,
  amount,
  closingBalanceAmount,
  narration,
  updateTransactionField,
  updateTransactionData,
  branch,
  company,
  transactionType,
  // resetCashTransactionData,
}) => {
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const RESULT_LIMIT = 25;
  const MIN_SEARCH_LENGTH = 2;
  const DEBOUNCE_DELAY = 300;
  const TRUNCATE_LENGTH = 30;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState(accountName || "");
  const [showDropdown, setShowDropdown] = useState(false);
  console.log("transactionType", transactionType);
  // ============================================================================
  // REFS
  // ============================================================================
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const isSearchEnabled = !!(
    company &&
    debouncedSearchTerm?.trim() &&
    debouncedSearchTerm.trim().length >= MIN_SEARCH_LENGTH 
    // !account
  );

  // ============================================================================
  // API QUERIES
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
      "",
      RESULT_LIMIT,
      {
        withOutstanding: true,
      }
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
   * Calculate closing balance when previous balance or amount changes
   */
  useEffect(() => {
    const prevBalance = parseFloat(previousBalanceAmount) || 0;
    const amountValue = parseFloat(amount) || 0;
 //// if it is payment amountValue will be  considered as negative for calculating closing
    let  closing;
    if (transactionType==="payment"){
           closing = prevBalance + amountValue;
    }else{
         closing = prevBalance - amountValue;
    }
    if (closing !== closingBalanceAmount) {
      updateTransactionField("closingBalanceAmount", closing);
    }
  }, [previousBalanceAmount, amount]);

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

  /**
   * Sync search term with accountName prop
   */
  useEffect(() => {
    if (accountName && accountName !== searchTerm) {
      setSearchTerm(accountName);
    }
  }, [accountName]);

  useEffect(() => {
    return () => {
      setSearchTerm("");
    };
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle search input changes
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);

    // Clear account ID when user starts typing
    if (account) {
      if (updateTransactionData) {
        updateTransactionData({
          account: "",
          accountName: value,
          previousBalanceAmount: 0,
        });
      }
    }
  };

  /**
   * Handle account selection from dropdown
   */
  const handleSelectAccount = useCallback(
    (account) => {
      const truncatedName = truncate(account.accountName, TRUNCATE_LENGTH);
      setSearchTerm(truncatedName);
      

      // Select previous balance based on transaction type
      const previousBalance =
        transactionType?.toLowerCase() === "receipt"
          ? account.outstandingDr || 0
          : account.outstandingCr || 0;

      console.log("Selected Previous Balance:", previousBalance);
      if (updateTransactionData) {
        updateTransactionData({
          accountName: account.accountName,
          account: account._id,
          previousBalanceAmount: previousBalance || 0,
        });
      } else {
        updateTransactionField("accountName", account.accountName);
        updateTransactionField("account", account._id);
        updateTransactionField("previousBalanceAmount", previousBalance || 0);
      }

      setShowDropdown(false);
    },
    [updateTransactionData, updateTransactionField, transactionType]
  );

  /**
   * Show dropdown when input is focused
   */
  const handleInputFocus = useCallback(() => {
    if (searchTerm.length >= MIN_SEARCH_LENGTH) {
      setShowDropdown(true);
    }
  }, [searchTerm]);

  /**
   * Clear selected account
   */
  const handleClearAccount = useCallback(() => {
    if (updateTransactionData) {
      updateTransactionData({
        accountName: "",
        account: "",
        previousBalanceAmount: 0,
        amount: 0,
        closingBalanceAmount: 0,
      });
    } else {
      updateTransactionField("accountName", "");
      updateTransactionField("account", "");
      updateTransactionField("previousBalanceAmount", 0);
      updateTransactionField("amount", 0);
      updateTransactionField("closingBalanceAmount", 0);
    }
    setSearchTerm("");
  }, [updateTransactionData, updateTransactionField]);

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
        <div className="px-3 py-2 text-[11px] text-slate-500 text-center">
          Searching...
        </div>
      );
    }

    if (accounts.length === 0) {
      return (
        <div className="text-[11px] text-slate-500 text-center">
          <p className="p-2">No accounts found</p>
          <button
            onClick={() => setShowDropdown(false)}
            className="block w-full py-1 cursor-pointer text-blue-600 hover:text-blue-700 bg-gray-200"
          >
            + Create new account
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
            className="px-3 py-2 text-[11px] hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0"
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
    <div className="w-full bg-white  shadow-sm border border-gray-200">
      <div className="p-2 space-y-2">
        {/* From Account with Search */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-gray-700 text-[11px] font-medium">
            From Account
          </label>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              name="accountName"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Search account name"
              className="w-full px-2 py-1.5 pr-7 border border-gray-300  text-[11px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            {renderInputIcon()}

            {/* Dropdown with search results */}
            {showDropdown && searchTerm.length >= MIN_SEARCH_LENGTH && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-white border border-slate-300  shadow-lg max-h-48 overflow-y-auto"
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
        </div>

        {/* Customer Name Display */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-gray-700 text-[11px] font-medium">
            Customer Name
          </label>
          <input
            type="text"
            value={accountName}
            readOnly
            className="flex-1 px-2 py-1.5 border border-gray-300  text-[11px] bg-slate-200 text-gray-900 focus:outline-none"
          />
        </div>

        {/* Amount and Balance Details */}
        <div className="flex items-end gap-2">
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-700 text-[11px] font-medium mb-1">
                Previous Balance Amount
              </label>
              <NumericFormat
                prefix="₹"
                thousandsGroupStyle="lakh"
                thousandSeparator=","
                value={previousBalanceAmount}
                disabled
                className="w-full px-2 py-1.5 border border-gray-300  text-[11px] bg-slate-200 text-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-[11px] font-medium mb-1">
                Amount
              </label>
              <NumericFormat
                prefix="₹"
                thousandsGroupStyle="lakh"
                thousandSeparator=","
                value={amount}
                onValueChange={(values) => {
                  updateTransactionField("amount", values.floatValue || 0);
                }}
                className="w-full px-2 py-1.5 border border-gray-300  text-[11px] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-[11px] font-medium mb-1">
                Closing Balance Amount
              </label>
              <NumericFormat
                prefix="₹"
                thousandsGroupStyle="lakh"
                thousandSeparator=","
                value={closingBalanceAmount}
                disabled
                className="w-full px-2 py-1.5 border border-gray-300  text-[11px] bg-slate-200 text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Narration */}
        <div className="flex gap-2">
          <label className="w-28 text-gray-700 text-[11px] font-medium pt-1">
            Narration
          </label>
          <textarea
            name="narration"
            value={narration}
            onChange={(e) =>
              updateTransactionField("narration", e.target.value)
            }
            rows="1"
            placeholder="Enter narration..."
            className="flex-1 px-2 py-1.5 border border-gray-300  text-[11px] bg-white text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default CashTransactionAccountSelector;
