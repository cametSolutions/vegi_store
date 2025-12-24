// api/services/stockAdjustmentServices.js
import axios from "axios";
import { createResourceApi } from "../client/apiFactory"; // NEW
import { api } from "../client/apiClient";

export const stockAdjustmentServices = {
  create: async (formData) => {
    try {
      console.log("📤 API URL:", "/stock-adjustment/create");
      console.log("📦 Payload:", formData);
      const response = await api.post("/stock-adjustment/create", formData); // CHANGED
      console.log("✅ Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ API Error:", error.response?.data || error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  getAll: async (
    pageParam = 1,
    limit = 25,
    searchTerm = "",
    companyId,
    branchId,
    sortBy = "adjustmentDate",
    sortOrder = "desc",
    adjustmentType = ""
  ) => {
    try {
      const response = await createResourceApi.get("/stock-adjustment/getall", { // CHANGED
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

  // Update ALL methods to use stockAdjustmentApi instead of api
  getById: async (companyId, branchId, adjustmentId) => {
    try {
      const response = await createResourceApi.get(
        `/stock-adjustment/getDetails/${adjustmentId}`,
        {
          params: { companyId, branchId },
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

  update: async (id, formData) => {
    try {
      const response = await createResourceApi.put(
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

  delete: async (id, companyId, branchId) => {
    try {
      const response = await createResourceApi.delete(
        `/stock-adjustment/delete/${id}`,
        {
          params: { companyId, branchId },
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

  getItemHistory: async (itemId, companyId, branchId, limit = 10) => {
    try {
      const response = await createResourceApi.get(
        `/stock-adjustment/item-history/${itemId}`,
        {
          params: { companyId, branchId, limit },
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