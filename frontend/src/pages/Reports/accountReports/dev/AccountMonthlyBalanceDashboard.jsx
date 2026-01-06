import React, { useState, useEffect } from "react";
import { api } from "@/api/client/apiClient";
import { useSelector } from "react-redux";

const AccountMonthlyBalanceDashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAccountGroup, setCurrentAccountGroup] = useState(null);

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
    year: new Date().getFullYear().toString(), // Current year
    page: 1,
    limit: 200,
  });

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const { data } = await api.get("/reports/account-monthly-summary", { params });
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

  const getNetMovement = (debit, credit) => {
    return debit - credit;
  };

  const getBalanceColor = (opening, closing) => {
    const netChange = closing - opening;
    return netChange >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-4 mx-auto bg-white min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Account Monthly Balance Summary</h1>
        <div className="flex space-x-2">
          <input
            type="text"
            className="border px-2 py-1 w-40"
            placeholder="Account ID (optional)"
            value={filters.accountId}
            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          />
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
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Account</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold">Branch</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Period</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Opening</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Debit</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Credit</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Net</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-bold">Closing</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Tx Count</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((record, index) => {
                const netMovement = getNetMovement(record.totalDebit, record.totalCredit);
                const verifyClosing = record.openingBalance + netMovement;
                const isBalanceCorrect = Math.abs(verifyClosing - record.closingBalance) < 0.001;
                
                return (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50 border-t border-gray-200"
                    style={{ 
                      backgroundColor: currentAccountGroup === `${record.accountName}-${record.accountCode}` 
                        ? '#f0f8ff' : 'white'
                    }}
                    onMouseEnter={() => setCurrentAccountGroup(`${record.accountName}-${record.accountCode}`)}
                    onMouseLeave={() => setCurrentAccountGroup(null)}
                  >
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-medium">{record.accountName}</div>
                      <div className="text-xs text-gray-500">{record.accountCode}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {record.branchName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="font-medium">{getMonthName(record.month)} {record.year}</div>
                      <div className="text-xs text-gray-500">{record.periodKey}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ₹{record.openingBalance.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium text-red-600">
                      ₹{record.totalDebit.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium text-green-600">
                      ₹{record.totalCredit.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                      {netMovement >= 0 ? '+' : ''}₹{netMovement.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                      <span className={getBalanceColor(record.openingBalance, record.closingBalance)}>
                        ₹{record.closingBalance.toFixed(2)}
                      </span>
                      {!isBalanceCorrect && (
                        <span className="text-red-500 text-xs ml-1">⚠</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {record.transactionCount}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {record.isClosed ? (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          CLOSED
                        </span>
                      ) : record.needsRecalculation ? (
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
          {monthlyData[0]?.pagination && (
            <span> | Page {monthlyData[0].pagination.currentPage} of {monthlyData[0].pagination.totalPages}</span>
          )}
        </div>
        <div>
          <span className="font-bold">Legend:</span> 
          <span className="ml-2 text-red-600">⚠ = Balance mismatch</span>
          <span className="ml-2">DIRTY = Needs recalculation</span>
          <span className="ml-2">CLOSED = Locked period</span>
        </div>
      </div>
    </div>
  );
};

export default AccountMonthlyBalanceDashboard;
