// hooks/queries/itemMasterQueries.js
import { queryOptions } from "@tanstack/react-query";
import { priceLevelServices } from "../../api/services/priceLevel.service";

export const priceLevelQueries = {
  all: () => ["pricelevel"],

  getAll: (companyId, branchId) =>
    queryOptions({
      queryKey: [...priceLevelQueries.all(), "getAll", companyId,branchId],
      queryFn: () => priceLevelServices.getAll(companyId,branchId),
      enabled: !!companyId && !!branchId,
      staleTime: 5 * 60 * 1000,
    }),
};
