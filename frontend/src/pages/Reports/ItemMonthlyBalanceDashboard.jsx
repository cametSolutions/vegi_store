import React, { useState, useEffect } from "react";
import { api } from "@/api/client/apiClient";
import { useSelector } from "react-redux";

const ItemMonthlyBalanceDashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
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
    year: "", // Default current year
    page: 1,
    limit: 200,
  });

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const { data } = await api.get("/reports/item-monthly-summary", { params });
      setMonthlyData(data.data);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [filters]);

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  const getNetMovement = (stockIn, stockOut) => {
    return stockIn - stockOut;
  };

  return (
    <div className="p-4  mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Item Monthly Balance Summary</h1>
        <div className="flex space-x-2">
          <input
            type="number"
            className="border px-2 py-1 w-24"
            placeholder="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          />
          <button
            className="bg-blue-500 text-white px-3 py-1 border rounded"
            onClick={() => setFilters({ ...filters, page: 1 })}
          >
            Filter
          </button>
          <button
            className="bg-green-500 text-white px-3 py-1 border rounded"
            onClick={fetchMonthlyData}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : monthlyData.length === 0 ? (
        <div>No data found</div>
      ) : (
        <div className="overflow-x-auto border">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Item</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Branch</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Period</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Opening</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">In</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Out</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Net</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Closing</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Tx Count</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((record, index) => {
                const netMovement = getNetMovement(record.totalStockIn, record.totalStockOut);
                const verifyClosing = record.openingStock + netMovement;
                const isBalanceCorrect = Math.abs(verifyClosing - record.closingStock) < 0.001;
                
                return (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50"
                    style={{ 
                      backgroundColor: currentItemGroup === `${record.itemName}-${record.itemCode}` 
                        ? '#f0f8ff' : 'white'
                    }}
                    onMouseEnter={() => setCurrentItemGroup(`${record.itemName}-${record.itemCode}`)}
                    onMouseLeave={() => setCurrentItemGroup(null)}
                  >
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-medium">{record.itemName}</div>
                      <div className="text-xs text-gray-500">{record.itemCode}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {record.branchName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="font-medium">{getMonthName(record.month)} {record.year}</div>
                      <div className="text-xs text-gray-500">{record.periodKey}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {record.openingStock.toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                      +{record.totalStockIn.toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                      -{record.totalStockOut.toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                      {netMovement >= 0 ? '+' : ''}{netMovement.toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                      {record.closingStock.toFixed(3)}
                      {!isBalanceCorrect && (
                        <span className="text-red-500 text-xs ml-1">⚠</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {record.transactionCount}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {record.needsRecalculation ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          DIRTY
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          CLEAN
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <div>
          Showing {monthlyData.length} records
        </div>
        <div>
          <span className="font-bold">Legend:</span> 
          <span className="ml-2 text-red-600">⚠ = Balance mismatch</span>
          <span className="ml-2">DIRTY = Needs recalculation</span>
        </div>
      </div>
    </div>
  );
};

export default ItemMonthlyBalanceDashboard;
