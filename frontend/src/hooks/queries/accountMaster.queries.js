import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import accountMasterServices  from "../../api/services/accountMaster.service";

export const accountMasterQueries = {
  all: () => ["accounts"],

  // Infinite list (pagination)
  infiniteList: (companyId, branchId = "", searchTerm = "", filterType = "", limit = 25) =>
    infiniteQueryOptions({
      queryKey: [...accountMasterQueries.all(), companyId, branchId, searchTerm, filterType],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await accountMasterServices.getAll(
          companyId,
          branchId,
          pageParam,
          limit,
          searchTerm,
          filterType
        );
        return response;
      },
      getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
      initialPageParam: 1,
      enabled: !!companyId,
      staleTime: 30000,
    }),

  // Single record
  detail: (id) =>
    queryOptions({
      queryKey: [...accountMasterQueries.all(), "detail", id],
      queryFn: async () => {
        const response = await accountMasterServices.getById(id);
        return response.data || response;
      },
      enabled: !!id,
      staleTime: 60000,
    }),

  // By branch
  byBranch: (branchId) =>
    queryOptions({
      queryKey: [...accountMasterQueries.all(), "branch", branchId],
      queryFn: async () => {
        const response = await accountMasterServices.getByBranch(branchId);
        return response.data || response;
      },
      enabled: !!branchId,
      staleTime: 60000,
    }),

  // By company
  byCompany: (companyId) =>
    queryOptions({
      queryKey: [...accountMasterQueries.all(), "company", companyId],
      queryFn: async () => {
        const response = await accountMasterServices.getByCompany(companyId);
        return response.data || response;
      },
      enabled: !!companyId,
      staleTime: 30000,
    }),
};
