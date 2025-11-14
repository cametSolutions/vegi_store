import { useInfiniteQuery } from "@tanstack/react-query";

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
import { useDebounce } from "@/hooks/useDebounce";
import { useTransaction } from "../../hooks/useTransaction";

const TransactionList = ({ onEditTransaction,selectedTransaction }) => {
  // Accept the prop
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
    searchTerm,
    totals: { totalAmount, totalOutstanding, totalPaid },
    getStatusColor,
    getTypeColor,
    handleSearchChange,
  } = useTransactionListActions();

  /// this is form state like data in the form not form api response
  

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
    transactionQueries.infiniteList(
      currentTransactionType,
      debouncedSearchTerm,
      companyId,
      branchId,
      12,
      "transactionDate",
      "desc",
      { refetchOnWindowFocus: false, retry: 2 }
    )
  );

  const allTransactions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  

  return (
    <div className="w-full h-[calc(100vh-110px)] bg-white rounded-xs shadow-sm border flex flex-col">
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

      <div className="flex-1 overflow-hidden">
        <ListTable
          data={allTransactions}
          getStatusColor={getStatusColor}
          getTypeColor={getTypeColor}
          isFetching={isFetching}
          status={status}
          refetch={refetch}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onEditTransaction={onEditTransaction} // Pass to ListTable
          editTransactionId={selectedTransaction?._id}
        />
      </div>

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
