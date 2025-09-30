// hooks/queries/accountMasterQueries.js
import { queryOptions } from '@tanstack/react-query';
import { accountMasterService } from '../../api/accountMasterApi';

export const accountMasterQueries = {
  all: () => ['accountMaster'],
  
  list: (companyId) => queryOptions({
    queryKey: [...accountMasterQueries.all(), 'list', companyId],
    queryFn: () => accountMasterService.getAll(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  }),

  search: (searchTerm, companyId,branchId, options = {}) => queryOptions({
    queryKey: [...accountMasterQueries.all(), 'search', searchTerm, companyId,branchId],
    queryFn: () => accountMasterService.search(searchTerm, companyId,branchId),
    staleTime: 2 * 60 * 1000,
    ...options
  }),

  detail: (id) => queryOptions({
    queryKey: [...accountMasterQueries.all(), 'detail', id],
    queryFn: () => accountMasterService.getById(id),
    enabled: !!id,
  }),
};
