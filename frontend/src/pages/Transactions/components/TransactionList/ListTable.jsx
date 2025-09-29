import { useState } from "react";
import { SortAscIcon } from "lucide-react";
import { StatusBadge, TypeBadge } from "./Badges";

const ListTable = ({ data, getStatusColor, getTypeColor }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });

  const columns = [
    { key: "id", label: "Bill No" },
    { key: "date", label: "Date" },
    // { key: "type", label: "Type" },
    { key: "party", label: "Party" },
    { key: "total", label: "Total", align: "right" },
    { key: "discount", label: "Discount", align: "right" },
    { key: "paid", label: "Paid", align: "right" },
    { key: "balance", label: "Balance", align: "right" },
    // { key: "status", label: "Status", align: "center", sortable: false },
  ];

  return (
    <div className="w-full border  shadow bg-white">
      <div className="h-[calc(100vh-228px)] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`sticky top-0 bg-slate-500 text-white border-b px-3 py-2 text-${column.align || "left"} text-[9px] font-medium text-gray-500 uppercase z-10 ${
                    column.sortable !== false ? "cursor-pointer hover:bg-gray-400" : ""
                  }`}
                  // onClick={
                  //   column.sortable !== false ? () => handleSort(column.key) : undefined
                  // }
                >
                  <div
                    className={`flex items-center ${
                      column.align === "right"
                        ? "justify-end"
                        : column.align === "center"
                        ? "justify-center"
                        : ""
                    } space-x-1`}
                  >
                    <span>{column.label}</span>
                    {/* {column.sortable !== false && (
                      <SortAscIcon
                        size={12}
                        className={`w-3 h-3 transition-transform ${
                          sortField === column.key && sortDirection === "desc"
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    )} */}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 cursor-pointer">
            {sortedData.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 text-[9px] font-medium text-gray-600">
                  {transaction.id}
                </td>
                <td className="px-3 py-2 text-[9px] text-gray-600">{transaction.date}</td>
                {/* <td className="px-3 py-2">
                  <TypeBadge type={transaction.type} getTypeColor={getTypeColor} />
                </td> */}
                <td className="px-3 py-2 text-[9px] font-medium text-gray-900 truncate max-w-24">
                  {transaction.party}
                </td>
                <td className="px-3 py-2 text-[9px] text-gray-900 text-right font-mono">
                  ₹{transaction.total.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-[9px] text-gray-900 text-right font-mono">
                  ₹{transaction.discount.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-[9px] text-gray-900 text-right font-mono">
                  ₹{transaction.paid.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right text-[9px] font-mono">
                  <span
                    className={`${transaction.balance > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    ₹{transaction.balance.toFixed(2)}
                  </span>
                </td>
                {/* <td className="px-3 py-2 text-center">
                  <StatusBadge status={transaction.status} getStatusColor={getStatusColor} />
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListTable;
