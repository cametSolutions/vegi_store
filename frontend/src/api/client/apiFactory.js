import { api } from "./apiClient";

export const createResourceApi = (resourcePath, customEndpoints = {}) => {
  
  const buildUrl = (endpoint, id = null, params = {}) => {
    let url = `/${resourcePath}`;
    if (endpoint) url += `/${endpoint}`;
    if (id) url += `/${id}`;
    
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value);
      }
    });
    
    return query.toString() ? `${url}?${query}` : url;
  };

  return {
    create: async (data) => {
      const url = buildUrl(customEndpoints.create);
      const response = await api.post(url, data);
      return response.data;
    },

    getAll: async (params) => {

      console.log("params",params);
      
      const url = buildUrl(customEndpoints.getAll, null, params);
      const response = await api.get(url);
      return response.data;
    },

    getById: async (id) => {
      const response = await api.get(`/${resourcePath}/${id}`);
      return response.data;
    },

    update: async (id, data, params = {}) => {
      const url = buildUrl(customEndpoints.update, id, params);
      const response = await api.put(url, data);
      return response.data;
    },

    delete: async (id, params = {}) => {
      const url = buildUrl(customEndpoints.delete, id, params);
      const response = await api.delete(url);
      return response.data;
    },
  };
};