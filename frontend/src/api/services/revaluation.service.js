import { api } from "../client/apiClient";
import { createResourceApi } from "../client/apiFactory";

export const revaluationApi = createResourceApi("revaluation", {
});

// export const priceLevelServices = {
//   // Inherit all base methods
//   ...priceLevelApi,

//  create: async (formData) => {
//     try {
//       const response = await api.post("/pricelevel", formData);
//       return response.data;
//     } catch (error) {
//       throw new Error(error.response?.data?.message || error.message);
//     }
//   },

//   // Get all price levels for company/branch
//   getAll: async (companyId, branchId) => {
//     try {
//       const response = await api.get("/pricelevel/getallpricelevel", {
//         params: { companyId, branchId },
//       });
//       return response.data;
//     } catch (error) {
//       throw new Error(error.response?.data?.message || error.message);
//     }
//   },

//   // Update a price level by its id
//   update: async (id, formData) => {
//     try {
//       const response = await api.put(`/pricelevel/${id}`, formData);
//       return response.data;
//     } catch (error) {
//       throw new Error(error.response?.data?.message || error.message);
//     }
//   },

//   // Delete a price level by its id
//   delete: async (id) => {
//     try {
//       const response = await api.delete(`/pricelevel/${id}`);
//       return response.data;
//     } catch (error) {
//       throw new Error(error.response?.data?.message || error.message);
//     }
//   },
  
// };


export const revaluationServices = {
  // Inherit all base methods
  ...revaluationApi,

  triggerRevaluation: async () => {
    try {
      const response = await api.post("/revaluation/trigger-revaluation");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },
};
