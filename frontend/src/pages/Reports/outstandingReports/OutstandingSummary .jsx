import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Filter, ChevronDown } from "lucide-react";
import { formatDate } from "../../../../../shared/utils/date";
import { formatINR } from "../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";

// You'll need to create these query functions
import { outstandingQueries } from "../../../hooks/queries/outstandingQueries ";

const OutstandingSummary = () => {
  const selectedCompany = useSelector(
    (state) => state?.companyBranch?.selectedCompany
  );
  const selectedBranch = useSelector(
    (state) => state?.companyBranch?.selectedBranch
  );

  const companyId = selectedCompany?._id;
  const branchId = selectedBranch?._id;

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [outstandingTypeFilter, setOutstandingTypeFilter] = useState("all"); // 'all', 'dr', 'cr'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Fetch all customers with outstanding
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery(
    outstandingQueries.customersList(companyId, branchId)
  );

const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
  ...outstandingQueries.customerDetails(
    companyId,
    branchId,
    selectedCustomer?._id,
    outstandingTypeFilter
  ),
  enabled: !!selectedCustomer,
});

  const customers = customersData?.data?.customers || [];
  const transactions = detailsData?.data?.transactions || [];
  const totalOutstanding = detailsData?.data?.totalOutstanding || 0;

  // Auto-select first customer if none selected
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

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
      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">DR</span>
    ) : (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">CR</span>
    );
  };

  return (
    <div className="h-[calc(100vh-99px)] flex bg-gray-50">
      {/* Left Section - Customer List (1/4 width) */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="flex-none p-3 border-b bg-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Outstanding Customers</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total: {customers.length} customers
          </p>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingCustomers ? (
            <div className="flex items-center justify-center h-full">
              <CustomMoonLoader />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xs">No outstanding customers</p>
            </div>
          ) : (
            <div className="divide-y">
              {customers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-3 cursor-pointer transition hover:bg-gray-50 ${
                    selectedCustomer?._id === customer._id
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {customer.accountName}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {customer.phone || "No phone"}
                      </p>
                    </div>
                    <div className="ml-2 text-right">
                      <p
                        className={`text-xs font-bold ${getOutstandingColor(
                          customer.outstandingType
                        )}`}
                      >
                        {formatINR(customer.totalOutstanding)}
                      </p>
                      {getOutstandingBadge(customer.outstandingType)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Transaction Details (3/4 width) */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-none bg-white shadow-sm border-b p-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-extrabold text-gray-900">
                {selectedCustomer?.accountName || "Select a Customer"}
              </h1>
              {selectedCustomer && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Total Outstanding:{" "}
                  <span
                    className={`font-bold ${getOutstandingColor(
                      selectedCustomer.outstandingType
                    )}`}
                  >
                    {formatINR(totalOutstanding)}
                  </span>
                </p>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
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

        {/* Transaction Table */}
        <div className="flex-1 overflow-hidden p-2">
          <div className="bg-white shadow-sm h-full flex flex-col">
            {!selectedCustomer ? (
              <div className="flex items-center justify-center flex-1">
                <p className="text-gray-500 text-sm">
                  Select a customer to view details
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
                {/* Table Header */}
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
                          style={{ width: "80px" }}
                        >
                          Type
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
                          style={{ width: "130px" }}
                        >
                          Closing Balance
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Table Body */}
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
                            {index + 1}
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
                            className="px-2 py-1.5 whitespace-nowrap text-xs text-center"
                            style={{ width: "80px" }}
                          >
                            {getOutstandingBadge(transaction.outstandingType)}
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
                            className={`px-2 py-1.5 whitespace-nowrap text-xs text-center font-bold ${getOutstandingColor(
                              transaction.outstandingType
                            )}`}
                            style={{ width: "130px" }}
                          >
                            {formatINR(transaction.closingBalanceAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="flex-none border-t-2 px-2">
                  <table className="w-full table-fixed">
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td style={{ width: "50px" }}></td>
                        <td style={{ width: "120px" }}></td>
                        <td style={{ width: "120px" }}></td>
                        <td style={{ width: "80px" }}></td>
                        <td style={{ width: "130px" }}></td>
                        <td
                          className="px-2 py-1.5 text-xs font-bold text-gray-900 text-center"
                          style={{ width: "130px" }}
                        >
                          Total Outstanding
                        </td>
                        <td
                          className={`px-2 py-1.5 text-xs font-bold text-center ${getOutstandingColor(
                            selectedCustomer?.outstandingType
                          )}`}
                          style={{ width: "130px" }}
                        >
                          {formatINR(totalOutstanding)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
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