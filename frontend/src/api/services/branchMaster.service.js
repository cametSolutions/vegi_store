import axios from "axios";
import { api } from "../client/apiClient.js";

export const branchMasterService = {
  // Search branches
  search: async (searchTerm, limit = 25, filters = {}) => {
    try {
      const response = await api.get("/branch/searchBranches", {
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

  // List branches with pagination
  list: async (searchTerm = "", limit = 30, skip = 0) => {
    try {
      const response = await api.get("/branch/list", {
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

  // Get branch by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/branch/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error fetching branch");
    }
  },

  // Create new branch
  create: async (data) => {
    try {
      const response = await api.post("/branch/create", data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error creating branch");
    }
  },

  // Update existing branch by ID
  update: async (id, data) => {
    try {
      const response = await api.put(`/branch/update/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error updating branch");
    }
  },

  // Delete branch by ID
  delete: async (id) => {
    try {
      const response = await api.delete(`/branch/delete/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("Error deleting branch");
    }
  },
};