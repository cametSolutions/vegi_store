// hooks/queries/stockAdjustmentQueries.js
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { stockAdjustmentServices } from "../../api/services/stockAdjustmentServices";

export const stockAdjustmentQueries = {
  all: () => ["stockAdjustments"],

  // Infinite list for paginated stock adjustments
  infiniteList: (
    searchTerm = "",
    companyId,
    branchId,
    limit = 25,
    sortBy = "adjustmentDate",
    sortOrder = "desc",
    adjustmentType = "",
    options = {}
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...stockAdjustmentQueries.all(),
        searchTerm,
        companyId,
        branchId,
        sortBy,
        sortOrder,
        adjustmentType,
      ],
      queryFn: ({ pageParam }) =>
        stockAdjustmentServices.getAll(
          pageParam,
          limit,
          searchTerm,
          companyId,
          branchId,
          sortBy,
          sortOrder,
          adjustmentType
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      ...options,
    }),

  // Get single stock adjustment by ID
  getStockAdjustmentById: (companyId, branchId, adjustmentId) =>
    queryOptions({
      queryKey: [
        ...stockAdjustmentQueries.all(),
        "getById",
        companyId,
        branchId,
        adjustmentId,
      ],
      queryFn: () =>
        stockAdjustmentServices.getById(companyId, branchId, adjustmentId),
      enabled: !!companyId && !!branchId && !!adjustmentId,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    }),

  // Get stock adjustment history for a specific item
  itemHistory: (itemId, companyId, branchId, limit = 10) =>
    queryOptions({
      queryKey: [
        ...stockAdjustmentQueries.all(),
        "itemHistory",
        itemId,
        companyId,
        branchId,
        limit,
      ],
      queryFn: () =>
        stockAdjustmentServices.getItemHistory(
          itemId,
          companyId,
          branchId,
          limit
        ),
      enabled: !!itemId && !!companyId && !!branchId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }),
};
