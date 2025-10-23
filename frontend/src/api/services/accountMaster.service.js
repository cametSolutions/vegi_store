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





  // Get all accounts with filters
  getAll: async (companyId, branchId = "", page = 1, limit = 25, searchTerm = "", filterType = "") => {
    const response = await api.get("/accounts", {
      params: { companyId, branchId, page, limit, searchTerm, filterType },
    });
    return response.data;
  },

  // Get by ID
  getById: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  // Create account
  create: async (data) => {
    const response = await api.post("/accounts", data);
    return response.data;
  },

  // Update account
  update: async (id, data) => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  },

  // Delete account
  delete: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  // Get by branch
  getByBranch: async (branchId) => {
    const response = await api.get(`/accounts/branch/${branchId}`);
    return response.data;
  },

  // Get by company
  getByCompany: async (companyId) => {
    const response = await api.get(`/accounts/company/${companyId}`);
    return response.data;
  },






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

export default accountMasterService;
