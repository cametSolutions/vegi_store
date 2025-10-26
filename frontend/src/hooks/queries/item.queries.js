// hooks/queries/itemMasterQueries.js
import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { itemServices } from "../../api/services/items.service";

export const itemMasterQueries = {
  all: () => ["item"],

  search: (
    searchTerm,
    companyId,
    branchId,
    limit = 25,
    exactMatch,
    options = {}
  ) =>
    queryOptions({
      queryKey: [
        ...itemMasterQueries.all(),
        "search",
        searchTerm,
        companyId,
        branchId,
        limit,
        exactMatch,
      ],
      queryFn: () =>
        itemServices.search(searchTerm, companyId, branchId, limit, exactMatch),
      ...options,
    }),

  list: (companyId, search = "") =>
    infiniteQueryOptions({
      queryKey: [...itemMasterQueries.all(), "list", companyId, search],
      queryFn: ({ pageParam = 1 }) =>
        itemServices.getAll(companyId, pageParam, 30, search),
      getNextPageParam: (lastPage, allPages) => {
        const hasMore = lastPage.data.items.length === 30;
        return hasMore ? allPages.length + 1 : undefined;
      },
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }),

  detail: (id) =>
    queryOptions({
      queryKey: [...itemMasterQueries.all(), "detail", id],
      queryFn: () => itemServices.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }),
};
