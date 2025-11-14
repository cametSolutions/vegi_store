import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { transactionServices } from "../../api/services/transaction.service";

export const transactionQueries = {
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
        ...transactionQueries.all(),
        transactionType,
        searchTerm,
        companyId,
        branchId,
        sortBy,
        sortOrder,
      ],
      queryFn: ({ pageParam }) =>
        transactionServices.getAll(
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
      getNextPageParam: (lastPage) => lastPage.nextPage,
      refetchOnWindowFocus: false, // Set default here
      staleTime: 30000, // Optional: 30 seconds
      ...options, // Allow overrides
    }),

  getTransactionById: (companyId, branchId, transactionId, transactionType) =>
    queryOptions({
      queryKey: [
        ...transactionQueries.all(),
        "getById",
        companyId,
        branchId,
        transactionId,
        transactionType,
      ],
      queryFn: () =>
        transactionServices.getById(
          companyId,
          branchId,
          transactionId,
          transactionType
        ),
      enabled:
        !!companyId && !!branchId && !!transactionId && !!transactionType,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      
    }),
};
