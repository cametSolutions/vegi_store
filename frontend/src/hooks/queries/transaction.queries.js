import { infiniteQueryOptions } from "@tanstack/react-query";
import { transactionServices } from "../../api/services/transaction.service";

export const transactionQueries = {
  all: () => ["transactions"],

  infiniteList: (
    transactionType,
    searchTerm = "",
    companyId,
    branchId,
    limit = 25,
    options = {}
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...transactionQueries.all(),
        transactionType,
        searchTerm,
        companyId,
        branchId,
      ],
      queryFn: ({ pageParam }) =>
        transactionServices.getAll(
          transactionType,
          pageParam,
          limit,
          searchTerm,
          companyId,
          branchId
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      refetchOnWindowFocus: false, // Set default here
      staleTime: 30000, // Optional: 30 seconds
      ...options, // Allow overrides
    }),
};
