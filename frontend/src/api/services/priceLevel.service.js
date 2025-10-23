import { api } from "../client/apiClient";
import { createResourceApi } from "../client/apiFactory";

export const priceLevelApi = createResourceApi("pricelevel", {
  create: "createpricelevel", //POST route
  getAll:"getallpricelevel",//GET route
  update: "update", //PUT route
  delete: "delete", //DELETE route
});

export const priceLevelServices = {
  // ==================== GET ALL WITH PAGINATION ====================
 getAll: async (companyId, page = 1, limit = 25, searchTerm = "", status = "active") => {
  const params = new URLSearchParams({
    companyId,
    page: page.toString(),
    limit: limit.toString(),
    ...(searchTerm && { search: searchTerm }),
    ...(status && { status }),
  });

  const response = await api.get(`/pricelevel/getallpricelevel?${params}`);
  return {
    data: response.data.data || [],
    nextPage: response.data.pagination?.nextPage || null,
    prevPage: response.data.pagination?.prevPage || null,
    totalCount: response.data.pagination?.totalCount || 0,
    totalPages: response.data.pagination?.totalPages || 0,
    currentPage: response.data.pagination?.currentPage || page,
  };
},

  // ==================== GET BY ID ====================
  getById: async (id) => {
    const response = await api.get(`/api/pricelevel/${id}`);
    return response.data.data;
  },

  // ==================== CREATE ====================
  create: async (data) => {
    const response = await api.post("/pricelevel/createpricelevel", data);
    return response.data.data;
  },

  // ==================== UPDATE ====================
  update: async (id, data) => {
    const response = await api.put(`/pricelevel/${id}`, data);
    return response.data.data;
  },

  // ==================== DELETE ====================
  delete: async (id) => {
    const response = await api.delete(`/pricelevel/${id}`);
    return response.data;
  },

  // ==================== GET ACTIVE ====================
  getActive: async (companyId) => {
    const response = await api.get(`/api/pricelevel/company/${companyId}/active`);
    return response.data.data;
  },

  // ==================== GET BY BRANCH ====================
  getByBranch: async (branchId) => {
    const response = await api.get(`/api/pricelevel/branch/${branchId}`);
    return response.data.data;
  },

  // ==================== GET UNALLOCATED ====================
  getUnallocated: async (companyId) => {
    const response = await api.get(`/api/pricelevel/company/${companyId}/unallocated`);
    return response.data.data;
  },

  // ==================== ALLOCATE TO BRANCHES ====================
  allocateToBranches: async (id, branchIds) => {
    const response = await api.post(`/api/pricelevel/${id}/allocate`, { branchIds });
    return response.data.data;
  },

  // ==================== REMOVE FROM BRANCHES ====================
  removeFromBranches: async (id, branchIds) => {
    const response = await api.post(`/api/pricelevel/${id}/remove`, { branchIds });
    return response.data.data;
  },

  // ==================== UPDATE STATUS ====================
  updateStatus: async (id, status) => {
    const response = await api.patch(`/api/pricelevel/${id}/status`, { status });
    return response.data.data;
  },

  // ==================== CHECK IF CAN BE DELETED ====================
  canBeDeleted: async (id) => {
    const response = await api.get(`/api/pricelevel/${id}/can-delete`);
    return response.data.data;
  },
};

// ==================== AXIOS CONFIG EXAMPLE ====================
/*
// File: api/axios.config.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
*/


