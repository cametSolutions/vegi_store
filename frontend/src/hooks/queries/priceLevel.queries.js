import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { priceLevelServices } from "../../api/services/priceLevel.service";



export const priceLevelQueries = {
  all: () => ["priceLevels"],

  // Infinite list (pagination)
  infiniteList: (companyId, searchTerm = "", status = "active", limit = 25) => ({
    queryKey: [...priceLevelQueries.all(), companyId, searchTerm, status],
  queryFn: async ({ pageParam = 1 }) => {
  const response = await priceLevelServices.getAll(
    companyId,
    pageParam,
    limit,
    searchTerm,
    status
  );
  return response; // use the object returned from service directly
},

    getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
    initialPageParam: 1,
    enabled: !!companyId,
    staleTime: 30000,
  }),

  // Single record
  detail: (id) => ({
    queryKey: [...priceLevelQueries.all(), "detail", id],
    queryFn: async () => {
      const response = await priceLevelServices.getById(id);
      return response.data || response;
    },
    enabled: !!id,
    staleTime: 60000,
  }),

  // Active price levels
  active: (companyId) => ({
    queryKey: [...priceLevelQueries.all(), "active", companyId],
    queryFn: async () => {
      const response = await priceLevelServices.getActive(companyId);
      return response.data || response;
    },
    enabled: !!companyId,
    staleTime: 60000,
  }),

  // By branch
  byBranch: (branchId) => ({
    queryKey: [...priceLevelQueries.all(), "branch", branchId],
    queryFn: async () => {
      const response = await priceLevelServices.getByBranch(branchId);
      return response.data || response;
    },
    enabled: !!branchId,
    staleTime: 60000,
  }),

  // Unallocated
  unallocated: (companyId) => ({
    queryKey: [...priceLevelQueries.all(), "unallocated", companyId],
    queryFn: async () => {
      const response = await priceLevelServices.getUnallocated(companyId);
      return response.data || response;
    },
    enabled: !!companyId,
    staleTime: 30000,
  }),
};

