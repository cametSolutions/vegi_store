import axios from "axios";
import { api } from "../client/apiClient.js";

export const companyMasterService = {
  // Search companies
  search: async (searchTerm, limit = 25, filters = {}) => {
    try {
      const response = await api.get("/company/searchCompanies", {
        params: {
          searchTerm,
          limit,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // List companies with pagination
  list: async (searchTerm = "", limit = 30, skip = 0) => {
    try {
      const response = await api.get("/company/list", {
        params: { searchTerm, limit, skip },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Get company by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/company/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error fetching company");
    }
  },

  // Create new company
  create: async (data) => {
    try {
      const response = await api.post("/company/create", data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error creating company");
    }
  },

  // Update existing company by ID
  update: async (id, data) => {
    try {
      const response = await api.put(`/company/update/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error updating company");
    }
  },

  // Delete company by ID
  delete: async (id) => {
    try {
      const response = await api.delete(`/company/delete/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error deleting company");
    }
  },
};
