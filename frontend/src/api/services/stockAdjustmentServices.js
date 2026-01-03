// api/services/stockAdjustmentServices.js
import axios from "axios";
import { api } from "../client/apiClient";

export const stockAdjustmentServices = {
  create: async (formData) => {
    try {
      console.log("📤 Creating stock adjustment");
      console.log("📦 Payload:", formData);
      
      const response = await api.post("/transaction/stock_adjustment/create", formData);
      
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
    sortBy = "transactionDate",
    sortOrder = "desc",
    adjustmentType = ""
  ) => {
    try {
      const response = await api.get("/transaction/stock_adjustment/getall", {
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

  getById: async (companyId, branchId, adjustmentId) => {
    try {
      const response = await api.get(
        `/transaction/stock_adjustment/getDetails/${adjustmentId}`,
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

 

// api/services/stockAdjustmentServices.js

update: async (id, formData) => {
  try {
    console.log("🔵 ================================");
    console.log("🔵 Service - update called");
    console.log("🔵 Service - id:", id);
    console.log("🔵 Service - id type:", typeof id);
    console.log("🔵 Service - formData:", formData);
    console.log("🔵 ================================");
    
    if (!id || id === "undefined" || id === undefined || id === null) {
      throw new Error("Invalid adjustment ID");
    }

    // Remove MongoDB fields
    const { 
      _id, 
      __v, 
      createdAt, 
      updatedAt, 
      status, 
      transactionNumber,
      createdBy,
      ...updateData 
    } = formData;

    const url = `/transaction/stock_adjustment/edit/${id}`;
    console.log("🔵 Service - Calling URL:", url);
    console.log("🔵 Service - Update data:", updateData);

    const response = await api.put(url, updateData);

    console.log("✅ ================================");
    console.log("✅ Service - Success");
    console.log("✅ Service - response.data:", response.data);
    console.log("✅ ================================");
    
    return response.data;
  } catch (error) {
    console.error("❌ ================================");
    console.error("❌ Service Error");
    console.error("❌ error:", error);
    console.error("❌ error.response:", error.response);
    console.error("❌ error.response.data:", error.response?.data);
    console.error("❌ ================================");
    
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message);
    }
    throw error;
  }
},


  delete: async (id, companyId, branchId) => {
    try {
      const response = await api.delete(
        `/transaction/stock_adjustment/delete/${id}`,
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
      const response = await api.get(
        `/transaction/stock_adjustment/item-history/${itemId}`,
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