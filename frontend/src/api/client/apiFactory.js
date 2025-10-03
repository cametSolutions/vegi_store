import { apiClient } from "./apiClient";

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
      const response = await apiClient.post(url, data);
      return response.data;
    },

    getAll: async (params) => {
      const url = buildUrl(customEndpoints.getAll, null, params);
      const response = await apiClient.get(url);
      return response.data;
    },

    getById: async (id) => {
      const response = await apiClient.get(`/${resourcePath}/${id}`);
      return response.data;
    },

    update: async (id, data, params = {}) => {
      const url = buildUrl(customEndpoints.update, id, params);
      const response = await apiClient.put(url, data);
      return response.data;
    },

    delete: async (id, params = {}) => {
      const url = buildUrl(customEndpoints.delete, id, params);
      const response = await apiClient.delete(url);
      return response.data;
    },
  };
};