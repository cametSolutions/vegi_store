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
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { LoaderCircle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

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

  const DEBOUNCE_DELAY = 500;

  const {
    sortField,
    sortDirection,
    sortedData,
    handleSort,
    searchTerm,
    totals: { totalAmount, totalOutstanding, totalPaid },
    getStatusColor,
    getTypeColor,
    handleSearchChange,
  } = useTransactionListActions();

  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Fetch data with useInfiniteQuery
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
    transactionQueries.infiniteList(
      currentTransactionType,
      debouncedSearchTerm,
      companyId,
      branchId,
      25,
      { refetchOnWindowFocus: false, retry: 2 }
    )
  );

  // Flatten all pages into single array
  const allTransactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  console.log("allTransactions", allTransactions);

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
          dataLength={allTransactions.length}
          next={fetchNextPage}
          hasMore={!!hasNextPage}
          loader={
            <div className="text-center py-4 text-gray-500">
              <LoaderCircle className="animate-spin" />
              <p className="mt-2">Loading more transactions...</p>
            </div>
          }
          // endMessage={
          //   <div className="text-center py-4 text-gray-400">
          //     <b>No more transactions to load</b>
          //   </div>
          // }
          scrollableTarget="scrollableDiv"
        >
          <table className="w-full">
            <ListTable
              data={allTransactions}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
              isFetching={isFetching}
              status={status}
              refetch={refetch}
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
    </div>
  );
};

export default TransactionList;
