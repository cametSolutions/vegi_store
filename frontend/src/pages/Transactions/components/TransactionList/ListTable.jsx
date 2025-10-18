import { formatDate } from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfiniteScroll from "react-infinite-scroll-component";

const ListTable = ({ 
  data, 
  isFetching, 
  status, 
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}) => {
  const columns = [
    { key: "id", label: "Bill No", width: "w-[12%]" },
    { key: "date", label: "Date", align: "center", width: "w-[12%]" },
    { key: "party", label: "Party", align: "left", width: "w-[20%]" },
    { key: "total", label: "Total", align: "center", width: "w-[14%]" },
    { key: "discount", label: "Disc", align: "center", width: "w-[14%]" },
    { key: "paid", label: "Paid", align: "center", width: "w-[14%]" },
    { key: "balance", label: "Balance", align: "right", width: "w-[14%]" },
  ];

  return (
    <div className="w-full border shadow bg-white overflow-hidden">
      {/* Fixed Header Table */}
      <div className="bg-slate-500 pr-3">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} text-white border-b px-3 py-2 text-${
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
        </table>
      </div>

      {/* Scrollable Body Table */}
      <div 
        id="scrollableDiv" 
        className="h-[calc(100vh-260px)] overflow-y-auto overflow-x-hidden"
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

              endMessage={
            data.length > 10 && (
              <div className="text-center py-4 font-semibold  text-gray-400 text-[9px]">
                No more transactions to load
              </div>
            )
          }
          scrollableTarget="scrollableDiv"
        >
          <table className="w-full border-collapse table-fixed">
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
                data.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <td className={`${columns[0].width} px-3 py-2 text-[8.5px] font-medium text-gray-600`}>
                      {transaction?.transactionNumber}
                    </td>
                    <td className={`${columns[1].width} px-3 py-2 text-[8.5px] text-gray-600 text-center`}>
                      {formatDate(transaction?.transactionDate)}
                    </td>
                    <td className={`${columns[2].width} px-3 py-2 text-[8.5px] font-medium text-gray-900 truncate`}>
                      {transaction?.account?.accountName}
                    </td>
                    <td className={`${columns[3].width} px-3 py-2 text-[8.5px] text-gray-900 text-center font-mono`}>
                      ₹{formatINR(transaction?.totalAmountAfterTax)}
                    </td>
                    <td className={`${columns[4].width} px-3 py-2 text-[8.5px] text-gray-900 text-center font-mono`}>
                      ₹{formatINR(transaction?.discountAmount)}
                    </td>
                    <td className={`${columns[5].width} px-3 py-2 text-[8.5px] text-gray-900 text-center font-mono`}>
                      ₹{formatINR(transaction?.paidAmount)}
                    </td>
                    <td className={`${columns[6].width} px-3 py-2 text-right text-[8.5px] font-mono`}>
                      <span
                        className={`${
                          transaction?.balanceAmount > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        ₹{formatINR(transaction?.netAmount)}
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

export default ListTable;


