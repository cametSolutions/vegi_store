import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { api } from "@/api/client/apiClient";
import { formatDateShort } from "../../../../../shared/utils/date";

const AccountLedgerDashboard = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );

  const [filters, setFilters] = useState({
    companyId: selectedCompanyFromStore || "",
    branchId: selectedBranchFromStore || "",
    accountId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 200,
  });

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const { data } = await api.get("/reports/account-ledger", { params });
      setLedgerData(data.data || []);
    } catch (error) {
      console.error("Error fetching account ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [filters]);

  return (
    <div className="p-4 mx-auto bg-white min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Account Ledger - All Transactions</h1>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Account ID"
            className="border px-2 py-1 w-40"
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          />
          <input
            type="date"
            className="border px-2 py-1"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            className="border px-2 py-1"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
          <button
            className="bg-blue-500 text-white px-3 py-1 border rounded"
            onClick={() => setFilters({ ...filters, page: 1 })}
          >
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : ledgerData?.length === 0 ? (
        <div>No data found</div>
      ) : (
        <div className="overflow-x-auto border">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Account Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Tx #</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Type</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Ledger Side</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Amount</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData?.map((ledger, index) => (
                <tr key={index} className="hover:bg-gray-50 border-t border-gray-200">
                  <td className="border border-gray-300 px-3 py-2">{formatDateShort(ledger.transactionDate)}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{ledger.accountName}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono text-xs">{ledger.transactionNumber}</td>
                  <td className="border border-gray-300 px-3 py-2">{ledger.transactionType.toUpperCase()}</td>
                  <td className="border border-gray-300 px-3 py-2">{ledger.ledgerSide.toUpperCase()}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">₹{ledger.amount.toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold">{ledger.runningBalance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-right">
        Showing {ledgerData.length} of {filters.limit} records
      </div>
    </div>
  );
};

export default AccountLedgerDashboard;
