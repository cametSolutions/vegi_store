// api/client/stockAdjustmentApiClient.js
import axios from "axios";

export const stockAdjustmentApi = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors if needed (for auth tokens, etc.)
stockAdjustmentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or however you store tokens
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);