import { formatDate } from "../../../../../../shared/utils/date";
import { formatINR } from "../../../../../../shared/utils/currency";
import { LoaderCircle, Printer, Ban } from "lucide-react"; // Added Ban icon
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

  const columns = [
    { key: "id", label: "Bill No", width: "w-[12%]" },
    { key: "date", label: "Date", align: "center", width: "w-[12%]" },
    { key: "party", label: "Party", align: "left", width: "w-[20%]" },
    { key: "total", label: "Total", align: "center", width: "w-[14%]" },
    { key: "discount", label: "Disc", align: "center", width: "w-[14%]" },
    { key: "paid", label: "Paid", align: "center", width: "w-[14%]" },
    { key: "balance", label: "Balance", align: "right", width: "w-[14%]" },
    { key: "Print", label: "Print", align: "right", width: "w-[12%]" },
  ];

  const handlePrintClick = (transaction) => {
    const transactionType = currentTransactionType || transaction?.transactionType || "sale";
    navigate(`/transactions/Print/${transaction._id}?type=${transactionType}`, {
      state: {
        companyId: selectedCompanyFromStore?._id,
        branchId: selectedBranchFromStore?._id,
      }
    });
  };

  const handleDoubleClick = (transaction) => {
    // Prevent editing if cancelled (optional)
    if (transaction.isCancelled) return;
    onEditTransaction(transaction);
  };

  return (
    <div className="w-full border shadow bg-white overflow-hidden">
      {/* Header (Same as before) */}
      <div className="bg-slate-500 pr-3">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} text-white border-b px-3 py-2 text-${
                    column.align || "center"
                  } text-[11px] font-medium uppercase ${
                    column.sortable !== false ? "cursor-pointer hover:bg-gray-400" : ""
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
              {/* Loading/Error/Empty states (Keep as is) */}
              
              {data && data.map((transaction) => {
                // ✅ LOGIC: Determine Row Style
                const isCancelled = transaction.isCancelled;
                const isSelected = editTransactionId === transaction._id;
                
                let rowClass = "transition-colors cursor-pointer ";
                
                if (isCancelled) {
                  // Cancelled Style: Reddish bg, gray text, strikethrough (optional)
                  rowClass += "bg-red-50 hover:bg-red-100 opacity-75 ";
                } else if (isSelected) {
                  // Selected Style
                  rowClass += "bg-[#add4f3] ";
                } else {
                  // Default Style
                  rowClass += "bg-slate-200 hover:bg-slate-300 ";
                }

                return (
                  <tr
                    key={transaction._id}
                    className={rowClass}
                    onDoubleClick={() => handleDoubleClick(transaction)}
                  >
                    {/* Bill No */}
                    <td className={`${columns[0].width} px-3 py-2 text-[9.5px] font-medium text-gray-600 relative`}>
                      
                      <span className={isCancelled ? "line-through decoration-red-400 decoration-2" : ""}>
                        {transaction?.transactionNumber}
                      </span>
                    </td>

                    {/* Date */}
                    <td className={`${columns[1].width} px-3 py-2 text-[9.5px] text-gray-600 text-center`}>
                      <span className={isCancelled ? "line-through text-gray-400" : ""}>
                        {formatDate(transaction?.transactionDate)}
                      </span>
                    </td>

                    {/* Party */}
                    <td className={`${columns[2].width} px-3 py-2 text-[9.5px] font-medium text-gray-900 truncate`}>
                      <span className={isCancelled ? "line-through text-gray-500" : ""}>
                        {transaction?.account?.accountName}
                      </span>
                      {/* {isCancelled && <span className="ml-2 text-[8px] text-red-600 font-bold uppercase">(Cancelled)</span>} */}
                    </td>

                    {/* Amounts (Total, Disc, Paid) */}
                    <td className={`${columns[3].width} px-3 py-2 text-[9.5px] text-gray-900 text-center font-mono`}>
                      <span className={isCancelled ? "line-through text-gray-400" : ""}>
                        ₹{formatINR(transaction?.totalAmountAfterTax)}
                      </span>
                    </td>
                    <td className={`${columns[4].width} px-3 py-2 text-[9.5px] text-gray-900 text-center font-mono`}>
                      <span className={isCancelled ? "line-through text-gray-400" : ""}>
                        ₹{formatINR(transaction?.discountAmount)}
                      </span>
                    </td>
                    <td className={`${columns[5].width} px-3 py-2 text-[9.5px] text-gray-900 text-center font-mono`}>
                      <span className={isCancelled ? "line-through text-gray-400" : ""}>
                        ₹{formatINR(transaction?.paidAmount)}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className={`${columns[6].width} px-3 py-2 text-right text-[9.5px] font-mono`}>
                      {isCancelled ? (
                         <span className="text-gray-400 font-bold">₹0.00</span>
                      ) : (
                        <span className={transaction?.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                          ₹{formatINR(transaction?.netAmount)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className={`${columns[7].width} px-3 py-2 text-center text-[9.5px] font-mono`}>
                      {/* {!isCancelled && ( */}
                        <button
                        disabled={isCancelled}
                          onClick={(e) => handlePrintClick(transaction)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          <Printer size={12} />
                        </button>
                      {/* )} */}
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
