// api/services/stockAdjustment.service.js
import axios from "axios";
import { api } from "../client/apiClient.js";
import { createResourceApi } from "../client/apiFactory.js";

// Base stock adjustment API using the generic factory
export const stockAdjustmentApi = createResourceApi("stock-adjustment", {
  getAll: "getall",
  update: "update",
  delete: "delete",
});

// Stock Adjustment specific methods
export const stockAdjustmentServices = {
  // Inherit all base methods
  ...stockAdjustmentApi,

  // Create stock adjustment
  create: async (formData) => {
    try {
      const response = await api.post(
        `/stock-adjustment/create`,
        formData
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Get all stock adjustments with pagination
  getAll: async (
    pageParam = 1,
    limit = 25,
    searchTerm = "",
    companyId,
    branchId,
    sortBy = "adjustmentDate",
    sortOrder = "desc",
    adjustmentType = "" // "add", "remove", or ""
  ) => {
    try {
      const response = await api.get(`/stock-adjustment/getall`, {
        params: {
          page: pageParam,
          limit,
          searchTerm,
          companyId,
          branchId,
          sortBy,
          sortOrder,
          adjustmentType,
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

  // Get stock adjustment by ID
  getById: async (companyId, branchId, adjustmentId) => {
    try {
      const response = await api.get(
        `/stock-adjustment/getDetails/${adjustmentId}`,
        {
          params: {
            companyId,
            branchId,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Update stock adjustment
  update: async (id, formData) => {
    try {
      const response = await api.put(
        `/stock-adjustment/edit/${id}`,
        formData
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Delete stock adjustment
  delete: async (id, companyId, branchId) => {
    try {
      const response = await api.delete(
        `/stock-adjustment/delete/${id}`,
        {
          params: {
            companyId,
            branchId,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  // Get stock adjustment history for a specific item
  getItemHistory: async (itemId, companyId, branchId, limit = 10) => {
    try {
      const response = await api.get(
        `/stock-adjustment/item-history/${itemId}`,
        {
          params: {
            companyId,
            branchId,
            limit,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },
};
