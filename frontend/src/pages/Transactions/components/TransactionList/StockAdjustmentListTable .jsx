// components/StockAdjustmentList/StockAdjustmentListTable.jsx
import React, { useRef, useCallback, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDate } from  "../../../../../../shared/utils/date";

const StockAdjustmentListTable = ({
  data,
  getAdjustmentTypeColor,
  isFetching,
  status,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onEditAdjustment,
  editAdjustmentId,
}) => {
  const observerTarget = useRef(null);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // Loading state
  if (status === "pending") {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500 text-sm">Failed to load stock adjustments</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">No stock adjustments found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-700 text-white sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-[11px]">DATE</th>
          
            <th className="px-3 py-2 text-center font-medium text-[11px]">
              TYPE
            </th>
          
            <th className="px-3 py-2 text-right font-medium text-[11px]">
              TOTAL AMOUNT
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((adjustment, index) => (
            <tr
              key={adjustment?._id || index}
              onClick={() => onEditAdjustment(adjustment)}
              className={`border-b border-slate-200 hover:bg-blue-50 cursor-pointer transition-colors ${
                editAdjustmentId === adjustment?._id
                  ? "bg-blue-100 border-l-4 border-l-blue-600"
                  : ""
              }`}
            >
              {/* Date */}
              <td className="px-3 py-2 text-[11px] text-slate-700">
                {formatDate(adjustment?.adjustmentDate)}
              </td>

              {/* Reference */}
             

              {/* Adjustment Type */}
              <td className="px-3 py-2 text-center">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getAdjustmentTypeColor(
                    adjustment?.adjustmentType
                  )}`}
                >
                  {adjustment?.adjustmentType === "add" ? "ADD" : "REMOVE"}
                </span>
              </td>

              {/* Items Count */}
             
              {/* Total Amount */}
              <td className="px-3 py-2 text-right text-[11px] font-semibold text-slate-800">
                ₹{(adjustment?.totalAmount || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        )}
      </div>
    </div>
  );
};

export default StockAdjustmentListTable;
