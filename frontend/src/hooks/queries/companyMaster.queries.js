import { queryOptions } from '@tanstack/react-query';
import { companyMasterService } from '../../api/services/companyMaster.service';

export const companyMasterQueries = {
  all: () => ['companyMaster'],
  
  list: (searchTerm = "", limit = 30) => queryOptions({
    queryKey: [...companyMasterQueries.all(), 'list', searchTerm],
    queryFn: ({ pageParam = 0 }) => companyMasterService.list(searchTerm, limit, pageParam),
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
  }),

  search: (searchTerm, limit = 25, filters = {}, options = {}) => queryOptions({
    queryKey: [...companyMasterQueries.all(), 'search', searchTerm, limit, filters],
    queryFn: () => companyMasterService.search(searchTerm, limit, filters),
    staleTime: 10 * 1000,
    ...options
  }),

  detail: (id) => queryOptions({
    queryKey: [...companyMasterQueries.all(), 'detail', id],
    queryFn: () => companyMasterService.getById(id),
    enabled: !!id,
  }),
};
