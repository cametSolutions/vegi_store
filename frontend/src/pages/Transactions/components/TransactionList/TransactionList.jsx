import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import ListFooter from "../../../CommonTransactionListComponents/ListFooter";
import ListHeader from "../../../CommonTransactionListComponents/ListHeader";
import ListSearch from "../../../CommonTransactionListComponents/ListSearch";
import ListTable from "./ListTable";
import { useTransactionListActions } from "../../hooks/useTransactionListActions";
import { useMemo } from "react";
import { getTransactionType } from "../../utils/transactionUtils";
import { useLocation } from "react-router-dom";
import { transactionQueries } from "@/hooks/queries/transaction.queries";
import { useSelector } from "react-redux";

const TransactionList = () => {
  const location = useLocation();
  const currentTransactionType = useMemo(
    () => getTransactionType(location),
    [location]
  );

  // Get company and branch IDs form redux

  const companyId = useSelector(
    (state) => state.companyBranch?.selectedCompany?._id
  );
  const branchId = useSelector(
    (state) => state.companyBranch?.selectedBranch?._id
  );

  console.log("currentTransactionType", currentTransactionType);

  // Fetch data with useInfiniteQuery
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(
    transactionQueries.infiniteList(
      currentTransactionType,
      "",
      companyId,
      branchId,
      20
    )
  );

  // Flatten all pages into single array
  const allTransactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const {
    sortField,
    sortDirection,
    searchTerm,
    sortedData,
    totals: { totalAmount, totalOutstanding, totalPaid },
    getStatusColor,
    getTypeColor,
    handleSort,
    handleSearchChange,
  } = useTransactionListActions(allTransactions);

  if (status === "pending") {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center">
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full h-[calc(100vh-110px)] flex items-center justify-center">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-110px)] bg-white rounded-xs shadow-sm border flex flex-col">
      {/* Header Section */}
      <div className="px-1 py-2 border-b flex-shrink-0">
        <ListHeader
          title="Recent Transactions"
          recordCount={data?.pages[0]?.totalCount || 0}
        />
        <ListSearch
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search by party, document, or type..."
        />
      </div>

      {/* Table Section with Infinite Scroll */}
      <div
        id="scrollableDiv"
        className="flex-1 overflow-y-auto overflow-x-auto"
      >
        <InfiniteScroll
          dataLength={sortedData.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage}
          loader={
            <div className="text-center py-4 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2">Loading more transactions...</p>
            </div>
          }
          endMessage={
            <div className="text-center py-4 text-gray-400">
              <b>No more transactions to load</b>
            </div>
          }
          scrollableTarget="scrollableDiv"
        >
          <table className="w-full">
            <ListTable
              data={sortedData}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
            />
          </table>
        </InfiniteScroll>
      </div>

      {/* Footer Section */}
      <div className="flex-shrink-0 border-t">
        <ListFooter
          totalAmount={totalAmount}
          totalPaid={totalPaid}
          totalOutstanding={totalOutstanding}
        />
      </div>

      {/* Optional: Show fetching indicator */}
      {isFetching && !isFetchingNextPage && (
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          Refreshing...
        </div>
      )}
    </div>
  );
};

export default TransactionList;
