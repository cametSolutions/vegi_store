import  api from "../../api/branchApi.js"; // Adjust path to your APIaxios"; // Adjust path to your axios instance
import { queryOptions } from "@tanstack/react-query";


// ==================== API CALLS ====================
const fetchBranches = async (companyId) => {
  const response = await api.get(`/branches`, {
    params: { companyId }
  });
  return response.data;
};

const fetchBranchById = async (branchId) => {
  const response = await api.get(`/branches/${branchId}`);
  return response.data;
};

const fetchActiveBranches = async (companyId) => {
  const response = await api.get(`/branches/active`, {
    params: { companyId }
  });
  return response.data;
};

const searchBranches = async (companyId, searchTerm) => {
  const response = await api.get(`/branches/search`, {
    params: { companyId, searchTerm }
  });
  return response.data;
};

// ==================== QUERY CONFIGURATIONS ====================
export const branchQueries = {
  list: (companyId) =>
    queryOptions({
      queryKey: ['branches', 'list', companyId],
      queryFn: () => fetchBranches(companyId),
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000,
    }),
};

// ==================== QUERY KEYS ====================
export const branchKeys = {
  all: ['branches'],
  lists: () => [...branchKeys.all, 'list'],
  list: (companyId) => [...branchKeys.lists(), companyId],
  details: () => [...branchKeys.all, 'detail'],
  detail: (id) => [...branchKeys.details(), id],
  active: (companyId) => [...branchKeys.all, 'active', companyId],
  search: (companyId, term) => [...branchKeys.all, 'search', companyId, term],
};