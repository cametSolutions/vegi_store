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
    sortBy = "transactionDate",
    sortOrder = "desc",
      startDate ,
    endDate ,
    options = {}
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...cashTransactionQueries.all(),
        transactionType,
        searchTerm,
        companyId,
        branchId,
      sortBy,
      sortOrder,
      startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate instanceof Date ? endDate.toISOString() : endDate,
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
          sortOrder,startDate ,
          endDate
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      refetchOnWindowFocus: false, // Set default here
      staleTime: 30000, // Optional: 30 seconds
      ...options, // Allow overrides
    }),
};
