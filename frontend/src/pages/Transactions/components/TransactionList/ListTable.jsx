import { formatDate } from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";
import { LoaderCircle, Printer, Ban } from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ListTable = ({
  data,
  isFetching,
  status,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onEditTransaction,
  editTransactionId,
  currentTransactionType,
}) => {
  const navigate = useNavigate();

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  // Helper to safely get tailwind text alignment class
  const getTextAlign = (align) => {
    switch (align) {
      case "right": return "text-right justify-end";
      case "center": return "text-center justify-center";
      case "left": return "text-left justify-start";
      default: return "text-center justify-center";
    }
  };

  const columns = [
    { key: "id", label: "Bill No", width: "w-[12%]", align: "left" },
    { key: "date", label: "Date", width: "w-[12%]", align: "center" },
    { key: "party", label: "Party", width: "w-[20%]", align: "left" }, // Changed to left for better readability
    { key: "total", label: "Total", width: "w-[14%]", align: "center" },
    { key: "discount", label: "Disc", width: "w-[14%]", align: "center" },
    { key: "balance", label: "Net", width: "w-[14%]", align: "right" },
    { key: "paid", label: "Paid", width: "w-[14%]", align: "center" },
    { key: "print", label: "Print", width: "w-[12%]", align: "right" }, // Print is the 8th column (index 7)
  ];

  const handlePrintClick = (transaction) => {
    const transactionType =
      currentTransactionType || transaction?.transactionType || "sale";
    navigate(`/transactions/Print/${transaction._id}?type=${transactionType}`, {
      state: {
        companyId: selectedCompanyFromStore?._id,
        branchId: selectedBranchFromStore?._id,
      },
    });
  };

  const handleDoubleClick = (transaction) => {
    if (transaction.isCancelled) return;
    onEditTransaction(transaction);
  };

  return (
    <div className="w-full border shadow bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-500 pr-3">
        {/* pr-3 adds padding for scrollbar alignment if scrollbar is visible in body */}
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} text-white border-b px-3 py-2 text-[11px] font-medium uppercase ${
                    column.sortable !== false
                      ? "cursor-pointer hover:bg-gray-400"
                      : ""
                  }`}
                >
                  <div className={`flex items-center ${getTextAlign(column.align)} space-x-1`}>
                    <span>{column.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

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
          scrollableTarget="scrollableDiv"
        >
          <table className="w-full border-collapse table-fixed">
            <tbody className="divide-y divide-gray-200">
              {data &&
                data.map((transaction) => {
                  const isCancelled = transaction.isCancelled;
                  const isSelected = editTransactionId === transaction._id;

                  let rowClass = "transition-colors cursor-pointer ";
                  if (isCancelled) {
                    rowClass += "bg-red-50 hover:bg-red-100 opacity-75 ";
                  } else if (isSelected) {
                    rowClass += "bg-[#add4f3] ";
                  } else {
                    rowClass += "bg-slate-200 hover:bg-slate-300 ";
                  }

                  return (
                    <tr
                      key={transaction._id}
                      className={rowClass}
                      onDoubleClick={() => handleDoubleClick(transaction)}
                    >
                      {/* 1. Bill No */}
                      <td
                        className={`${columns[0].width} px-3 py-2 text-[9.5px] font-medium text-gray-600 relative text-left`}
                      >
                        <span
                          className={
                            isCancelled
                              ? "line-through decoration-red-400 decoration-2"
                              : ""
                          }
                        >
                          {transaction?.transactionNumber}
                        </span>
                      </td>

                      {/* 2. Date */}
                      <td
                        className={`${columns[1].width} px-3 py-2 text-[9.5px] text-gray-600 text-center`}
                      >
                        <span
                          className={
                            isCancelled ? "line-through text-gray-400" : ""
                          }
                        >
                          {formatDate(transaction?.transactionDate)}
                        </span>
                      </td>

                      {/* 3. Party */}
                      <td
                        className={`${columns[2].width} px-3 py-2 text-[9.5px] font-medium text-gray-900 truncate text-left`}
                      >
                        <span
                          className={
                            isCancelled ? "line-through text-gray-500" : ""
                          }
                        >
                          {transaction?.account?.accountName}
                        </span>
                      </td>

                      {/* 4. Total */}
                      <td
                        className={`${columns[3].width} px-3 py-2 text-[9.5px] text-gray-900 text-center font-mono`}
                      >
                        <span
                          className={
                            isCancelled ? "line-through text-gray-400" : ""
                          }
                        >
                          ₹{formatINR(transaction?.totalAmountAfterTax)}
                        </span>
                      </td>

                      {/* 5. Disc */}
                      <td
                        className={`${columns[4].width} px-3 py-2 text-[9.5px] text-gray-900 text-center font-mono`}
                      >
                        <span
                          className={
                            isCancelled ? "line-through text-gray-400" : ""
                          }
                        >
                          ₹{formatINR(transaction?.discountAmount)}
                        </span>
                      </td>

                      {/* 6. Balance (Fixed Index: was columns[6], now columns[5]) */}
                      <td
                        className={`${columns[5].width} px-3 py-2 text-right text-[9.5px] font-mono`}
                      >
                        {isCancelled ? (
                          <span className="text-gray-400 font-bold">₹0.00</span>
                        ) : (
                          <span className="text-gray-900">
                            ₹{formatINR(transaction?.netAmount)}
                          </span>
                        )}
                      </td>

                      {/* 7. Paid (Fixed Index: was columns[5], now columns[6]) */}
                      <td
                        className={`${columns[6].width} px-3 py-2 text-[9.5px] text-gray-900 text-center font-mono`}
                      >
                        <span
                          className={
                            isCancelled ? "line-through text-gray-400" : ""
                          }
                        >
                          ₹{formatINR(transaction?.paidAmount)}
                        </span>
                      </td>

                      {/* 8. Print (Fixed Index: was columns[7], removed duplicate Paid column) */}
                      <td
                        className={`${columns[7].width} px-3 py-2 text-center text-[9.5px] font-mono`}
                      >
                        <button
                          disabled={isCancelled}
                          onClick={(e) => handlePrintClick(transaction)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-semibold cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <Printer size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default ListTable;
