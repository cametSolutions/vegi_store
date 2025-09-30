// services/accountMasterService.js
import { createResourceApi, api } from "./apiClient";

// Base account master API using the generic factory
export const accountMasterApi = createResourceApi("accountmaster", {
  create: "createaccountmaster",
  getAll: "getallaccountmaster", 
  update: "updateaccntmaster",
  delete: "deleteaccntmaster",
});

// Account Master specific additional methods
export const accountMasterService = {
  // Inherit all base methods
  ...accountMasterApi,

  // Custom search method specific to account master
  search: async (searchTerm, companyId,branchId) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (companyId) params.append('companyId', companyId);
      if (branchId) params.append('branchId', branchId);
      
      const response = await api.get(`/accountmaster/searchAccounts?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

};
