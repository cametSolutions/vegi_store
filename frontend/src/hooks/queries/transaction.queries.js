import { infiniteQueryOptions } from '@tanstack/react-query';
import { transactionServices } from '../../api/services/transaction.service';

export const transactionQueries = {
  all: () => ['transactions'],
  
  infiniteList: (transactionType, searchTerm = '', companyId, branchId, limit = 25) => 
    infiniteQueryOptions({
      queryKey: [...transactionQueries.all(), transactionType, searchTerm, companyId, branchId, limit],
      queryFn: ({ pageParam }) => 
        transactionServices.getAll(transactionType, pageParam, limit, searchTerm, companyId, branchId),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }),
};
