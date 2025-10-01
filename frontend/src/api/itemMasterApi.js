import { api, createResourceApi } from "./apiClient"
export const itemMasterApi=createResourceApi("item",{
create:"createitem",//POST route
getAll:"getallitems",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})


// Account Master specific additional methods
export const itemMasterService = {
  // Inherit all base methods
  ...itemMasterApi,

  // Custom search method specific to account master
  search: async (searchTerm, companyId, branchId, limit) => {
    
    try {
      const response = await api.get("/item/searchItem", {
        params: { searchTerm, companyId, branchId, limit },
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
