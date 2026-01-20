import axios from "axios";
import { toast } from "sonner";

let baseUrl;

const ENV = import.meta.env.VITE_ENV;

console.log(ENV);

// Base axios instance

if (ENV === "development") {
  baseUrl = "http://localhost:4000/api";
} else if (ENV === "testing") {
  baseUrl = "https://farm2carttest.camet.in/api";
} else {
  baseUrl = "https://farm2cart.camet.in/api";
}

export const api = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ sends cookies/auth info
});

// 🔹 Add response interceptor
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !isRedirecting) {
      isRedirecting = true; // prevent multiple triggers
      toast.error("Session expired. Please log in again.");
      setTimeout(() => {
        localStorage.removeItem("user");
        window.location.href = "/login";
        isRedirecting = false; // reset after navigation
      }, 2000);
    }
    return Promise.reject(error);
  }
);

// // Generic resource API factory
// export const createResourceApi = (resourcePath, customEndpoints) => {
//   return {
//     create: async (data) => {
//       const url = customEndpoints?.create
//         ? `/${resourcePath}/${customEndpoints.create}`
//         : `/${resourcePath}`;
//       try {
//         const response = await api.post(url, data);
//         return response.data;
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           throw new Error(error.response?.data?.message || error.message);
//         }
//         throw new Error("An unexpected error occurred");
//       }
//     },

//     getAll: async (companyId) => {
//       try {
//         const url = customEndpoints?.getAll
//           ? `/${resourcePath}/${customEndpoints.getAll}?companyId=${companyId}`
//           : `/${resourcePath}?companyId=${companyId}`;
//         console.log("custom", customEndpoints);

//         const response = await api.get(url);
//         return response.data;
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           throw new Error(error.response?.data?.message || error.message);
//         }
//         throw new Error("An unexpected error occurred");
//       }
//     },

//     getById: async (id) => {
//       try {
//         const response = await api.get(`/${resourcePath}/${id}`);
//         return response.data;
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           throw new Error(error.response?.data?.message || error.message);
//         }
//         throw new Error("An unexpected error occurred");
//       }
//     },

//     update: async (params, data) => {
//       try {
//         let url;
//         if (customEndpoints?.update) {
//           url = `/${resourcePath}/${customEndpoints.update}/${params.id}`;
//         } else {
//           url = `/${resourcePath}/${params.id}`;
//         }
//         const query = new URLSearchParams();
//         if (params.companyId) query.append("companyId", params.companyId);
//         if (params.branchId) query.append("branchId", params.branchId);
//         if (query.toString()) {
//           url += `?${query.toString()}`;
//         }
//         const response = await api.put(url, data);
//         return response.data;
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           throw new Error(error.response?.data?.message || error.message);
//         }
//         throw new Error("An unexpected error occurred");
//       }
//     },

//     delete: async (params) => {
//       try {
//         let url;

//         if (customEndpoints?.delete) {
//           // If custom endpoint is provided
//           url = `/${resourcePath}/${customEndpoints.delete}/${params.id}`;
//         } else {
//           // Default endpoint
//           url = `/${resourcePath}/${params.id}`;
//         }

//         // Add query params if companyId/branchId are passed
//         const query = new URLSearchParams();
//         if (params.companyId) query.append("companyId", params.companyId);
//         if (params.branchId) query.append("branchId", params.branchId);

//         if (query.toString()) {
//           url += `?${query.toString()}`;
//         }

//         console.log("DELETE url:", url);
//         const response = await api.delete(url);
//         return response.data;
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           throw new Error(error.response?.data?.message || error.message);
//         }
//         throw new Error("An unexpected error occurred");
//       }
//     },

//     search: async (searchTerm, companyId) => {
//       try {
//         const params = new URLSearchParams();
//         if (searchTerm) params.append("searchTerm", searchTerm);
//         if (companyId) params.append("companyId", companyId);

//         const response = await api.get(
//           `/${resourcePath}/search?${params.toString()}`
//         );
//         return response.data;
//       } catch (error) {
//         if (axios.isAxiosError(error)) {
//           throw new Error(error.response?.data?.message || error.message);
//         }
//         throw new Error("An unexpected error occurred");
//       }
//     },
//   };
// };
