import React, { useState, useRef, useEffect } from "react";
import { User, Search, Loader2, X } from "lucide-react";
import { getPartyLabel } from "../utils/transactionUtils";
import { useDebounce } from "../../../hooks/useDebounce";
import { accountMasterQueries } from "@/hooks/queries/useAccountMaster";
import { useQuery } from "@tanstack/react-query";
import { truncate } from "../../../../../shared/utils/string";

const TransactionAccountSelector = ({
  transactionData,
  updateTransactionField,
  updateTransactionData,
  branch,
  company,
}) => {
  const partyLabel = getPartyLabel(transactionData.type);

  // Local state for search and dropdown
  const [searchTerm, setSearchTerm] = useState(
    transactionData.accountName || ""
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch accounts from API
  const {
    data: apiResponse,
    isLoading,
    isFetching,
  } = useQuery({
    ...accountMasterQueries.search(
      debouncedSearchTerm,
      company,
      branch,
      "customer"
    ),
    enabled: !!(
      company &&
      debouncedSearchTerm?.trim() &&
      debouncedSearchTerm.length >= 2 &&
      transactionData.accountType === "customer"
    ),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: { success: false, count: 0, data: [] },
  });

  // Extract accounts array from the nested response structure
  const accounts = apiResponse?.data || [];

  console.log("accounts", accounts);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateTransactionField("accountName", value);
    setShowDropdown(true);
  };

  // Handle account selection
  const handleSelectAccount = (account) => {
    const truncatedAccountName = truncate(account.accountName, 30);
    setSearchTerm(truncatedAccountName);
    updateTransactionData({
      accountName: account.accountName,
      balance: account.openingBalance || 0,
      accountId: account.id,
      email: account.email,
      phone: account.phoneNo,
    });
    setShowDropdown(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-x-1 gap-y-2 bg-white px-3">
      {/* Account Type */}
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
              checked={transactionData.accountType === "customer"}
              onChange={(e) => {
                updateTransactionField("accountType", e.target.value);
                setSearchTerm("");
                updateTransactionField("accountName", "");
              }}
              className="mr-1 text-blue-600 scale-75 cursor-pointer"
            />
            {partyLabel}
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="others"
              checked={transactionData.accountType === "others"}
              onChange={(e) => {
                updateTransactionData({
                  accountType: e.target.value,
                  accountName: "",
                  balance: 0,
                  accountId: "",
                  email: "",
                  phone: "",
                });
                // updateTransactionField("accountType", e.target.value);
                // updateTransactionField("accountName", "");
                setSearchTerm("");
              }}
              className="mr-1 text-blue-600 scale-75 cursor-pointer"
            />
            Others
          </label>
        </div>
      </div>

      {/* Account Name with Autocomplete */}
      <div
        className={` ${
          transactionData?.accountType === "others"
            ? "opacity-50 pointer-events-none"
            : ""
        }  relative`}
      >
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
          {isFetching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-blue-500" />
          )}

          {transactionData?.accountId && (
            <X
              className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 mt-[1.2px] text-slate-400 cursor-pointer"
              onClick={() => {
                updateTransactionData({
                  accountType: "customer",
                  accountName: "",
                  balance: 0,
                  accountId: "",
                  email: "",
                  phone: "",
                });
                setSearchTerm("");
              }}
            />
          )}
          {!isFetching &&
            searchTerm.length >= 2 &&
            !transactionData?.accountId && (
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            )}
        </div>

        {/* Dropdown with search results */}
        {showDropdown && searchTerm.length >= 2 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-48 overflow-y-auto"
          >
            {isLoading ? (
              <div className="px-3 py-2 text-[9px] text-slate-500 text-center">
                Searching...
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleSelectAccount(account)}
                  className="px-3 py-2 text-[9px] hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                >
                  <div className="font-medium text-slate-700">
                    {/* {account.accountName} */}
                    {truncate(account.accountName, 20)}
                  </div>

                  {account.openingBalance !== undefined && (
                    <div className="text-slate-600 text-[8px] mt-0.5">
                      Bal: ₹{account.openingBalance.toFixed(2)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-[9px] text-slate-500 text-center">
                No {partyLabel.toLowerCase()}s found
                <button
                  onClick={() => setShowDropdown(false)}
                  className="block w-full mt-2 text-blue-600 hover:text-blue-700"
                >
                  + Create new {partyLabel.toLowerCase()}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Helper text */}
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <div className="text-[8px] text-slate-500 mt-1">
            Type at least 2 characters to search
          </div>
        )}
      </div>

      {/* Opening Balance */}
      <div
        className={`${
          transactionData?.accountType === "others"
            ? "opacity-50 pointer-events-none"
            : ""
        }`}
      >
        <label className="block text-[9px] font-medium text-slate-700 mb-1">
          Opening Balance
        </label>
        <input
          type="number"
          value={transactionData.balance}
          onChange={(e) =>
            updateTransactionField("balance", parseFloat(e.target.value) || 0)
          }
          className="w-full px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default TransactionAccountSelector;
