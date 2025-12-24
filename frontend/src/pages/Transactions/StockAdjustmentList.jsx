// components/StockAdjustmentList/StockAdjustmentList.jsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useDebounce } from "@/hooks/useDebounce";
import { stockAdjustmentQueries } from "@/hooks/queries/stockAdjustmentQueries ";
import ListFooter from "../CommonTransactionListComponents/ListFooter";
import ListHeader from "../CommonTransactionListComponents/ListHeader";
import ListSearch from "../CommonTransactionListComponents/ListSearch";
import StockAdjustmentListTable from "../Transactions/components/TransactionList/StockAdjustmentListTable ";
import { useStockAdjustmentListActions } from "../stock/hooks/useStockAdjustmentListActions ";

const StockAdjustmentList = ({ onEditAdjustment, selectedAdjustment }) => {
  const companyId = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branchId = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  const DEBOUNCE_DELAY = 500;

  const {
    searchTerm,
    calculateTotals,
    getAdjustmentTypeColor,
    handleSearchChange,
    handleExport,
  } = useStockAdjustmentListActions();

  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery(
    stockAdjustmentQueries.infiniteList(
      debouncedSearchTerm,
      companyId,
      branchId,
      30,
      "adjustmentDate",
      "desc",
      "",
      { refetchOnWindowFocus: false, retry: 2 }
    )
  );

  const allAdjustments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Calculate totals from all adjustments
  const totals = useMemo(() => {
    return calculateTotals(allAdjustments);
  }, [allAdjustments, calculateTotals]);

  return (
    <div className="w-full h-[calc(100vh-110px)] bg-white rounded-xs shadow-sm border flex flex-col">
      <div className="px-1 py-2 border-b flex-shrink-0">
        <ListHeader
          title="Recent Stock Adjustments"
          recordCount={data?.pages[0]?.totalCount || 0}
          onExport={() => handleExport(allAdjustments)}
        />
        <ListSearch
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search by reference or adjustment type..."
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <StockAdjustmentListTable
          data={allAdjustments}
          getAdjustmentTypeColor={getAdjustmentTypeColor}
          isFetching={isFetching}
          status={status}
          refetch={refetch}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onEditAdjustment={onEditAdjustment}
          editAdjustmentId={selectedAdjustment?._id}
        />
      </div>

      <div className="flex-shrink-0 border-t">
        <ListFooter
          totalAmount={totals.totalAmount}
          customFooter={
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <div>
                <span className="font-medium">Total Adjustments:</span>{" "}
                {allAdjustments.length}
              </div>
              <div>
                <span className="font-medium text-green-700">Added:</span>{" "}
                {totals.totalAddAdjustments}
              </div>
              <div>
                <span className="font-medium text-red-700">Removed:</span>{" "}
                {totals.totalRemoveAdjustments}
              </div>
              <div>
                <span className="font-medium">Total Items:</span>{" "}
                {totals.totalItemsAdjusted}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default StockAdjustmentList;
