// hooks/queries/itemMasterQueries.js
import { queryOptions } from '@tanstack/react-query';
import { itemServices } from '../../api/services/items.service';

export const itemMasterQueries = {
  all: () => ['item'],
  
  search: (searchTerm, companyId,branchId,limit=25,exactMatch, options = {}) => queryOptions({
    queryKey: [...itemMasterQueries.all(), 'search', searchTerm, companyId,branchId, limit,exactMatch],
    queryFn: () => itemServices.search(searchTerm, companyId,branchId, limit,exactMatch),
    ...options
  }),

  list: (companyId) => queryOptions({
    queryKey: [...itemMasterQueries.all(), 'list', companyId],
    queryFn: () => itemServices.getAll(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  }),
};
