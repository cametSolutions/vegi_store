import React, { useState, useEffect } from "react";
import { api } from "@/api/client/apiClient";
import { useSelector } from "react-redux";
import { formatDate, formatDateShort } from "../../../../../shared/utils/date";

const OutstandingReport = () => {
  const [outstandingData, setOutstandingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAccountGroup, setCurrentAccountGroup] = useState(null);
  const [summary, setSummary] = useState(null);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );

  const [filters, setFilters] = useState({
    companyId: selectedCompanyFromStore || "",
    branchId: selectedBranchFromStore || "",
    accountType: "", // customer, supplier, bank, cash
    outstandingType: "", // dr (receivable), cr (payable)
    status: "", // pending, partial, paid, overdue
    startDate: "",
    endDate: "",
    page: 1,
    limit: 200,
  });

  const fetchOutstandingData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const { data } = await api.get("/reports/outstanding-report", { params });
      setOutstandingData(data.data || []);
    } catch (error) {
      console.error("Error fetching outstanding report:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        companyId: filters.companyId,
        branchId: filters.branchId,
      });
      const { data } = await api.get("/reports/outstanding-summary", { params });
      setSummary(data.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  useEffect(() => {
    fetchOutstandingData();
    fetchSummary();
  }, [filters]);

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue && status !== "paid") {
      return "bg-red-100 text-red-800";
    }
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      disputed: "bg-purple-100 text-purple-800",
      written_off: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getTransactionTypeBadge = (type) => {
    const typeColors = {
      sale: "bg-green-100 text-green-800",
      purchase: "bg-blue-100 text-blue-800",
      sales_return: "bg-orange-100 text-orange-800",
      purchase_return: "bg-purple-100 text-purple-800",
      opening_balance: "bg-gray-100 text-gray-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-4 mx-auto bg-white min-h-screen">
      {/* Header with filters */}
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-4">Outstanding Report</h1>
        
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {summary.map((item) => (
              <div
                key={item._id}
                className={`p-4 rounded-lg border ${
                  item._id === "dr" ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <h3 className="font-semibold mb-2">
                  {item._id === "dr" ? "Receivables (₹)" : "Payables (₹)"}
                </h3>
                <div className="text-2xl font-bold">
                  ₹{Math.abs(item.totalOutstanding).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Total: ₹{item.totalAmount.toFixed(2)} | Paid: ₹
                  {item.totalPaid.toFixed(2)}
                </div>
                <div className="text-sm text-red-600 mt-1">
                  Overdue: {item.overdueCount} (₹
                  {Math.abs(item.overdueAmount).toFixed(2)})
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            className="border px-3 py-1 rounded"
            value={filters.accountType}
            onChange={(e) =>
              setFilters({ ...filters, accountType: e.target.value, page: 1 })
            }
          >
            <option value="">All Account Types</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>

          <select
            className="border px-3 py-1 rounded"
            value={filters.outstandingType}
            onChange={(e) =>
              setFilters({ ...filters, outstandingType: e.target.value, page: 1 })
            }
          >
            <option value="">All Types</option>
            <option value="dr">Receivables (DR)</option>
            <option value="cr">Payables (CR)</option>
          </select>

          <select
            className="border px-3 py-1 rounded"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>

          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value, page: 1 })
            }
          />
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value, page: 1 })
            }
          />
          
          <button
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            onClick={() => fetchOutstandingData()}
          >
            Apply Filters
          </button>
          
          <button
            className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
            onClick={() => {
              setFilters({
                ...filters,
                accountType: "",
                outstandingType: "",
                status: "",
                startDate: "",
                endDate: "",
                page: 1,
              });
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : outstandingData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No outstanding records found</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Account
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Type
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Tx #
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Tx Type
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">
                  Total Amount
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">
                  Paid Amount
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">
                  Balance
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Status
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {outstandingData.map((item, index) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 border-t border-gray-200"
                  style={{
                    backgroundColor:
                      currentAccountGroup === item.accountName
                        ? "#f0f8ff"
                        : "white",
                  }}
                  onMouseEnter={() => setCurrentAccountGroup(item.accountName)}
                  onMouseLeave={() => setCurrentAccountGroup(null)}
                >
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {formatDateShort(item.transactionDate)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="font-medium">{item.accountName}</div>
                    {item.accountPhone && (
                      <div className="text-xs text-gray-500">
                        {item.accountPhone}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        item.outstandingType === "dr"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.outstandingType === "dr" ? "Receivable" : "Payable"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 font-mono text-xs">
                    {item.transactionNumber}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${getTransactionTypeBadge(
                        item.transactionType
                      )}`}
                    >
                      {item.transactionType.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                    ₹{item.totalAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    ₹{item.paidAmount.toFixed(2)}
                  </td>
                  <td
                    className={`border border-gray-300 px-3 py-2 text-right font-bold ${
                      item.closingBalanceAmount > 0
                        ? "text-green-600"
                        : item.closingBalanceAmount < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    ₹{Math.abs(item.closingBalanceAmount).toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${getStatusBadge(
                        item.status,
                        item.isOverdue
                      )}`}
                    >
                      {item.isOverdue && item.status !== "paid"
                        ? "OVERDUE"
                        : item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {formatDateShort(item.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Showing {outstandingData.length} records</span>
        <span>
          Hover over rows to highlight same account transactions
        </span>
      </div>
    </div>
  );
};

export default OutstandingReport;
