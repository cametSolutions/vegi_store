import { formatDate } from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ListTable = ({ data, isFetching, status ,refetch}) => {
  const columns = [
    { key: "id", label: "Bill No" },
    { key: "date", label: "Date", align: "center" },
    { key: "party", label: "Party", align: "center" },
    { key: "total", label: "Total", align: "center" },
    { key: "discount", label: "Discount", align: "center" },
    { key: "paid", label: "Paid", align: "center" },
    { key: "balance", label: "Balance", align: "right" },
  ];

  return (
    <div className="w-full border shadow bg-white">
      <div className="h-[calc(100vh-228px)] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-white border-b px-3 py-2 text-${
                    column.align || "center"
                  } text-[9px] font-medium uppercase ${
                    column.sortable !== false
                      ? "cursor-pointer hover:bg-gray-400"
                      : ""
                  }`}
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
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isFetching ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 ">
                  <div className="flex items-center justify-center h-[calc(100vh-460px)]">
                    <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
                  </div>
                </td>
              </tr>
            ) : status === "error" ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 h-[calc(100vh-260px)]">
                  <p className="text-gray-500 text-xs font-semibold">
                   !Oops..Error loading transactions
                  </p>
                  <button
                   onClick={refetch}
                   className="text-[10px] cursor-pointer font-semibold bg-blue-400 p-1 px-2 text-white rounded mt-2">Retry</button>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 h-[calc(100vh-260px)]">
                  <p className="text-gray-500 text-sm">No transactions found</p>
                </td>
              </tr>
            ) : (
              data.map((transaction) => (
                <tr
                  key={transaction._id}
                  className="bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2 text-[8.5px] font-medium text-gray-600">
                    {transaction?.transactionNumber}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] text-gray-600">
                    {formatDate(transaction?.transactionDate)}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] font-medium text-gray-900 truncate max-w-24">
                    {transaction?.account?.accountName}
                  </td>

                  <td className="px-3 py-2 text-[8.5px] text-gray-900 text-center font-mono">
                    ₹{formatINR(transaction?.totalAmountAfterTax)}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] text-gray-900 text-right font-mono">
                    ₹{formatINR(transaction?.discountAmount)}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] text-gray-900 text-right font-mono">
                    ₹{formatINR(transaction?.paidAmount)}
                  </td>
                  <td className="px-3 py-2 text-right text-[8.5px] font-mono">
                    <span
                      className={`${
                        transaction?.balanceAmount > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      ₹{formatINR(transaction?.balanceAmount)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListTable;
