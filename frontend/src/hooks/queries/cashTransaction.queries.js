import { infiniteQueryOptions } from "@tanstack/react-query";
import { cashTransactionServices } from "../../api/services/cashTransaction.service";

export const cashTransactionQueries = {
  all: () => ["transactions"],

  infiniteList: (
    transactionType,
    searchTerm = "",
    companyId,
    branchId,
    limit = 25,
    sortBy,
    sortOrder,
    options = {}
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...cashTransactionQueries.all(),
        transactionType,
        searchTerm,
        companyId,
        branchId,
      ],
      queryFn: ({ pageParam }) =>
        cashTransactionServices.getAll(
          transactionType,
          pageParam,
          limit,
          searchTerm,
          companyId,
          branchId,
          sortBy,
          sortOrder
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        // Your API returns pagination with nextPage
        if (!lastPage?.pagination) {
          return undefined;
        }
        
        const { hasMore, nextPage } = lastPage.pagination;
        
        // If hasMore is true and nextPage exists, return it
        // Otherwise return undefined to stop fetching
        return hasMore && nextPage ? nextPage : undefined;
      },
      refetchOnWindowFocus: false,
      staleTime: 30000,
      ...options,
    }),
};
