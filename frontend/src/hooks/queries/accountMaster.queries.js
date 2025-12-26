// hooks/queries/accountMasterQueries.js
import { queryOptions } from "@tanstack/react-query";
import { accountMasterService } from "../../api/services/accountMaster.service";

export const accountMasterQueries = {
  all: () => ["accountMaster"],

  list: (
    searchTerm = "",
    companyId,
    branchId = null,
    accountType = null,
    limit = 30
  ) =>
    queryOptions({
      queryKey: [...accountMasterQueries.all(), "list", companyId, searchTerm],
      queryFn: ({ pageParam = 0 }) =>
        accountMasterService.list(
          searchTerm,
          companyId,
          null,
          null,
          limit,
          {},
          pageParam
        ),
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000,
      initialPageParam: 0, // Add this for v5
    }),
  listWithOutstanding: (
    companyId,
    branchId = null,
    accountType = null,
    page,
    limit = 30,
    searchTerm
  ) =>
    queryOptions({
      queryKey: [
        "reports",
        ...accountMasterQueries.all(),
        "listWithOutstanding",
        companyId,
        searchTerm,
      ],
      queryFn: ({ pageParam = 0 }) =>
        accountMasterService.listWithOutstanding(
          searchTerm,
          companyId,
          branchId,
          accountType,
          page,
          limit
        ),
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000,
      initialPageParam: 0, // Add this for v5
    }),

  search: (
    searchTerm,
    companyId,
    branchId,
    accountType,
    limit = 25,
    filters = {},
    options = {}
  ) =>
    queryOptions({
      queryKey: [
        ...accountMasterQueries.all(),
        "search",
        searchTerm,
        companyId,
        branchId,
        accountType,
        limit,
        filters,
      ],
      queryFn: () =>
        accountMasterService.search(
          searchTerm,
          companyId,
          branchId,
          accountType,
          limit,
          filters
        ),
      staleTime: 10 * 1000,
      ...options,
    }),

  detail: (id) =>
    queryOptions({
      queryKey: [...accountMasterQueries.all(), "detail", id],
      queryFn: () => accountMasterService.getById(id),
      enabled: !!id,
    }),

  getAccountStatement: (
  startDate,
  endDate,
  company,
  branch,
  account,
  transactionType,
  page = 1,
  limit = 50,
  searchTerm
) =>
  queryOptions({
    queryKey: [
      "reports",
      ...accountMasterQueries.all(),
      "getAccountStatement",
      startDate,
      endDate,
      company,
      branch,
      account,
      transactionType,
      page,
      limit,
      searchTerm,
    ],
    queryFn: ({ pageParam = 0 }) => {
      // // ✅ DEBUG LOG
      // console.log("🚀 Fetching Account Statement:", {
      //   startDate,
      //   endDate,
      //   company,
      //   branch,
      //   account,
      //   transactionType,
      //   page,
      //   limit,
      //   searchTerm,
      //   pageParam // Check if infinite query logic is interfering
      // });

      return accountMasterService.getAccountStatement(
        startDate,
        endDate,
        company,
        branch,
        account,
        transactionType,
        page,
        limit,
        searchTerm
      );
    },
    enabled: !!company, // Ensure company exists
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
  }),

};
