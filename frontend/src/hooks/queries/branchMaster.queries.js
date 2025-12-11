import { queryOptions } from '@tanstack/react-query';
import { branchMasterService } from '../../api/services/branchMaster.service';

export const branchMasterQueries = {
  all: () => ['branchMaster'],
  
  list: (searchTerm = "", limit = 30) => queryOptions({
    queryKey: [...branchMasterQueries.all(), 'list', searchTerm],
    queryFn: ({ pageParam = 0 }) => branchMasterService.list(searchTerm, limit, pageParam),
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
  }),

  search: (searchTerm, limit = 25, filters = {}, options = {}) => queryOptions({
    queryKey: [...branchMasterQueries.all(), 'search', searchTerm, limit, filters],
    queryFn: () => branchMasterService.search(searchTerm, limit, filters),
    staleTime: 10 * 1000,
    ...options
  }),

  detail: (id) => queryOptions({
    queryKey: [...branchMasterQueries.all(), 'detail', id],
    queryFn: () => branchMasterService.getById(id),
    enabled: !!id,
  }),
};