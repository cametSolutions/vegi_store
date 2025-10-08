// services/accountMasterService.js
import axios from "axios";
import {  api } from "../client/apiClient.js";
import { createResourceApi } from "../client/apiFactory.js";

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
  search: async (searchTerm, companyId, branchId, accountType, limit, filters = {}) => {
    try {
      const response = await api.get("/accountmaster/searchAccounts", {
        params: { searchTerm, companyId, branchId, accountType, limit,...filters },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

    list: async ( companyId, branchId, accountType) => {
    try {
      const response = await api.get("/accountmaster/list", {
        params: { searchTerm, companyId, branchId, accountType, limit },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },
};
