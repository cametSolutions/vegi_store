// hooks/queries/itemMasterQueries.js
import { queryOptions } from '@tanstack/react-query';
import { itemMasterService } from '../../api/itemMasterApi';

export const itemMasterQueries = {
  all: () => ['item'],
  
  search: (searchTerm, companyId,branchId,limit=25, options = {}) => queryOptions({
    queryKey: [...itemMasterQueries.all(), 'search', searchTerm, companyId,branchId, limit],
    queryFn: () => itemMasterService.search(searchTerm, companyId,branchId, limit),
    staleTime: 2 * 60 * 1000,
    ...options
  }),

  list: (companyId) => queryOptions({
    queryKey: [...itemMasterQueries.all(), 'list', companyId],
    queryFn: () => itemMasterService.getAll(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  }),
};
