import { api } from "../client/apiClient";
import { createResourceApi } from "../client/apiFactory";

export const priceLevelApi = createResourceApi("pricelevel", {
});

export const priceLevelServices = {
  // Inherit all base methods
  ...priceLevelApi,

  getAll: async (companyId, branchId) => {
    try {
      const response = await api.get("/pricelevel/getallpricelevel", {
        params: { companyId, branchId },
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
