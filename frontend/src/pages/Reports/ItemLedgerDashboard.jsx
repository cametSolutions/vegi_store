import React, { useState, useEffect } from "react";
import axios from "axios";
import { api } from "@/api/client/apiClient";
import { useSelector } from "react-redux";

const ItemLedgerDashboard = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentItemGroup, setCurrentItemGroup] = useState(null);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );
  
  const [filters, setFilters] = useState({
    companyId: selectedCompanyFromStore || "",
    branchId: selectedBranchFromStore || "",
    itemId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 200, // Show more rows
  });

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const { data } = await api.get("/reports/item-ledger", { params });
      setLedgerData(data.data);
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [filters]);

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const getMovementSign = (movementType) => {
    return movementType === "in" ? "+" : "-";
  };

  return (
    <div className="p-4  mx-auto bg-white min-h-screen ">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Item Ledger - All Transactions</h1>
        <div className="flex space-x-2">
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
      ) : ledgerData.length === 0 ? (
        <div>No data found</div>
      ) : (
        <div className="overflow-x-auto border">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Item</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Branch</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Tx #</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Type</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Qty</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Rate</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Amount</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">After Tax</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((ledger, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50 border-t border-gray-200"
                  style={{ 
                    backgroundColor: currentItemGroup === `${ledger.itemName}-${ledger.itemCode}` 
                      ? '#f0f8ff' : 'white'
                  }}
                  onMouseEnter={() => setCurrentItemGroup(`${ledger.itemName}-${ledger.itemCode}`)}
                  onMouseLeave={() => setCurrentItemGroup(null)}
                >
                  <td className="border border-gray-300 px-3 py-2">
                    {formatDate(ledger.transactionDate)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="font-medium">{ledger.itemName}</div>
                    <div className="text-xs text-gray-500">{ledger.itemCode}</div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{ledger.branchName}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono text-xs">
                    {ledger.transactionNumber}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      {ledger.movementType.toUpperCase()}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                    {getMovementSign(ledger.movementType)}{ledger.quantity.toFixed(3)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    ₹{ledger.rate.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                    ₹{ledger.baseAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    ₹{ledger.amountAfterTax.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                    {ledger.runningStockBalance.toFixed(3)}
                  </td>
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

export default ItemLedgerDashboard;
