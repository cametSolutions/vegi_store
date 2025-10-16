import ListFooter from "../../../CommonTransactionListComponents/ListFooter";
import ListHeader from "../../../CommonTransactionListComponents/ListHeader";
import ListSearch from "../../../CommonTransactionListComponents/ListSearch";
import CashTRansactioListTable from "./CashTRansactionListTable";
import { useTransactionListActions } from "../../../Transactions/hooks/useTransactionListActions";
import { useMemo } from "react";
import { getTransactionType } from "../../Utils/CashTransactionUtils";
import { useLocation } from "react-router-dom";
import { cashTransactionQueries } from "@/hooks/queries/cashTransaction.queries";
import { useSelector } from "react-redux";
import CustomMoonLoader from "@/components/loaders/CustomMoonLoader";
import { LoaderCircle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
const TransactionList = () => {
  const location = useLocation();
   const currentTransactionType = useMemo(
      () => getTransactionType(location),
      [location]
    );
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
    searchTerm,
    sortedData,
    totals: { totalAmount, totalOutstanding, totalPaid },
    getStatusColor,
    getTypeColor,
    handleSort,
    handleSearchChange,
  } = useTransactionListActions();

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
    cashTransactionQueries.infiniteList(
      currentTransactionType,
      debouncedSearchTerm,
      companyId,
      branchId,
      25,
        "transactionDate", /// sort by date
      "desc", // sortOrder  for MongoDB
      { refetchOnWindowFocus: false, retry: 2 }
    )
  );
const allTransactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  return (
    <div className="w-full h-[calc(100vh-110px)] bg-white rounded-xs shadow-sm border flex flex-col">
      {/* Header Section */}
      <div className="px-1 py-2 border-b  flex-shrink-0">
        <ListHeader
          title="Recent Transactions"
          recordCount={sortedData.length}
        />
        <ListSearch
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search by party, document, or type..."
        />
      </div>

      <div className="flex-1 overflow-hidden">
          <CashTRansactioListTable
            data={allTransactions}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
              isFetching={isFetching}
              status={status}
              refetch={refetch}
          />
       
   
      </div>

      {/* Footer Section */}
      <div className="flex-shrink-0 border-t">
        <ListFooter
          totalAmount={totalAmount}
          
        />
      </div>
   </div>
  );
};

export default TransactionList;