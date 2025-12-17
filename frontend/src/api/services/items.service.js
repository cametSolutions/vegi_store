import axios from "axios";
import { api } from "../client/apiClient";
import { createResourceApi } from "../client/apiFactory";
export const itemMasterApi = createResourceApi("item", {
  create: "create", //POST route
  getAll: "getall", //GET route
  update: "update", //PUT route
  delete: "delete", //DELETE route
});

// Account Master specific additional methods
export const itemServices = {
  // Inherit all base methods
  ...itemMasterApi,

  // Custom search method specific to account master
  search: async (
    searchTerm,
    companyId,
    branchId,
    limit,
    exactMatch = false
  ) => {
    try {
      const response = await api.get("/item/searchItem", {
        params: { searchTerm, companyId, branchId, limit, exactMatch },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  getAll: async (companyId, page = 1, limit = 20, search = "") => {
    try {
      const response = await api.get("/item/getall", {
        params: { companyId, page, limit, search },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  create: async (formData) => {
    try {
      const response = await api.post("/item/create", formData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/item/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw new Error("An unexpected error occurred");
    }
  },

  updateRate: async (itemId, priceLevelId, rate) => {
    const response = await api.patch(`/item/${itemId}/rate`, {
      priceLevelId,
      rate,
    });
    return response.data;
  },

  getItemSummary: async (
    companyId,
    branchId,
    startDate,
    endDate,
    transactionType="sale",
    page,
    limit
  ) => {
    console.log({
      companyId,
    branchId,
    startDate,
    endDate,
    transactionType:"sale",
    page,
    limit
    });

    try {
      const response = await api.get("/reports/items-summary", {
        params: {
          company: companyId,
          branch: branchId,
          startDate,
          endDate,
          transactionType,
          page,
          limit,
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
};
