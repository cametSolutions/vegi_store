import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { formatDate } from '../../../../../../shared/utils/date';
import { formatINR } from '../../../../../../shared/utils/currency';
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { Button } from "@/components/ui/button";
import InfiniteScroll from "react-infinite-scroll-component";

const TransactionList = ({ 
  data, 
  isFetching, 
  status, 
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}) => {
  const columns = [
    { key: "billNo", label: "Bill No", align: "left" },
    { key: "payDate", label: "Pay Date", align: "center" },
    { key: "accountName", label: "Account Name", align: "center" },
    { key: "previousBalance", label: "Previous Balance", align: "right" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "closingBalance", label: "Closing Balance", align: "right" },
  ];

  return (
  <div className="w-full border shadow bg-white">
      <div 
        id="scrollableDiv" 
        className="h-[calc(100vh-228px)] overflow-auto"
      >
        <InfiniteScroll
          dataLength={data.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage}
          loader={
            <div className="text-center py-4 text-gray-500">
              <LoaderCircle className="animate-spin mx-auto w-5 h-5" />
              <p className="mt-2 text-xs">Loading more...</p>
            </div>
          }
          scrollableTarget="scrollableDiv"
        >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-white border-b px-3 py-2 text-[9px] font-medium uppercase`}
                >
                  <div
                    className={`flex items-center ${
                      column.align === "right"
                        ? "justify-end"
                        : column.align === "center"
                        ? "justify-center"
                        : "justify-start"
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
                <td colSpan={columns.length} className="text-center py-20">
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
                    className="text-[10px] cursor-pointer font-semibold bg-blue-400 p-1 px-2 text-white rounded mt-2"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 h-[calc(100vh-260px)]">
                  <p className="text-gray-500 text-sm">No transactions found</p>
                </td>
              </tr>
            ) : (
              data.map((transaction, index) => (
                <tr
                  key={transaction.billNo || index}
                  className="bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2 text-[8.5px] font-medium text-gray-600">
                    {transaction.billNo}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] text-gray-600 text-center">
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] font-medium text-gray-900 truncate max-w-24 text-center">
                    {transaction.accountName}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] text-gray-900 text-right font-mono">
                    ₹{formatINR(transaction.previousBalanceAmount)}
                  </td>
                  <td className="px-3 py-2 text-[8.5px] text-gray-900 text-right font-mono">
                    ₹{formatINR(transaction.amount)}
                  </td>
                  <td className="px-3 py-2 text-right text-[8.5px] font-mono">
                    <span
                      className={`${
                        transaction.closingBalanceAmount > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      ₹{formatINR(transaction.closingBalanceAmount)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </InfiniteScroll>
      </div>
    </div>
  );
};

export default TransactionList;