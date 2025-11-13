import React from "react";
import { LoaderCircle } from "lucide-react";
import { formatDate } from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";
import InfiniteScroll from "react-infinite-scroll-component";

const CashTransactionListTable = ({
  data,
  isFetching,
  status,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) => {
  const columns = [
    { key: "billNo", label: "Bill No", align: "left", width: "w-[15%]" },
    { key: "payDate", label: "Pay Date", align: "center", width: "w-[15%]" },
    {
      key: "accountName",
      label: "Account Name",
      align: "center",
      width: "w-[25%]",
    },
    {
      key: "previousBalance",
      label: "Previous Balance",
      align: "right",
      width: "w-[15%]",
    },
    { key: "amount", label: "Amount", align: "right", width: "w-[15%]" },
    {
      key: "closingBalance",
      label: "Closing Balance",
      align: "right",
      width: "w-[15%]",
    },
  ];

  // Show initial loading state
  if (isFetching && !data?.length) {
    return (
      <div className="w-full h-full border shadow bg-white flex items-center justify-center">
        <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
      </div>
    );
  }

  // Show error state
  if (status === "error") {
    return (
      <div className="w-full h-full border shadow bg-white flex items-center justify-center">
        
        <div className="text-center">
          <p className="text-gray-500 text-xs font-semibold">
            !Oops..Error loading transactions
          </p>
          <button
            onClick={refetch}
            className="text-[10px] cursor-pointer font-semibold bg-blue-400 p-1 px-2 text-white rounded mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full border shadow bg-white flex items-center justify-center">
        
        <p className="text-gray-500 text-sm">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full border shadow bg-white overflow-hidden flex flex-col">
      {/* Fixed Header Table */}
      <div className="bg-slate-500 flex-shrink-0">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} text-white border-b px-3 pr-0 py-2 text-[9.5px] font-medium uppercase`}
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
        </table>
      </div>

      {/* Scrollable Body with InfiniteScroll */}
      <div
        id="scrollableDiv"
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <InfiniteScroll
          dataLength={data.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage && !isFetchingNextPage}
          scrollableTarget="scrollableDiv"
          loader={
            <div className="text-center py-4 text-gray-500 bg-white">
              <LoaderCircle className="animate-spin mx-auto w-5 h-5" />
              <p className="mt-2 text-xs">Loading more...</p>
            </div>
          }
          endMessage={
            data.length > 10 && (
              <div className="text-center py-4 font-semibold  text-gray-400 text-[10px]">
                No more transactions to load
              </div>
            )
          }
        >
          <table className="w-full border-collapse table-fixed">
            <tbody className="divide-y divide-gray-200">
              {data.map((transaction, index) => (
                <tr
                  key={transaction.billNo || index}
                  className="bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <td
                    className={`${columns[0].width} px-3 py-2 text-[9px] font-medium text-gray-600`}
                  >
                    {transaction.billNo}
                  </td>
                  <td
                    className={`${columns[1].width} px-3 py-2 text-[9px] text-gray-600 text-center`}
                  >
                    {formatDate(transaction.transactionDate)}
                  </td>
                  <td
                    className={`${columns[2].width} px-3 py-2 text-[9px] font-medium text-gray-900 truncate text-center`}
                  >
                    {transaction.accountName}
                  </td>
                  <td
                    className={`${columns[3].width} px-3 py-2 text-[9px] text-gray-900 text-right font-mono`}
                  >
                    ₹{formatINR(transaction.previousBalanceAmount)}
                  </td>
                  <td
                    className={`${columns[4].width} px-3 py-2 text-[9px] text-gray-900 text-right font-mono`}
                  >
                    ₹{formatINR(transaction.amount)}
                  </td>
                  <td
                    className={`${columns[5].width} px-3 py-2 text-right text-[9px] font-mono`}
                  >
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
              ))}
            </tbody>
          </table>
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default CashTransactionListTable;