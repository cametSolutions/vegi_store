import axios, { AxiosInstance } from "axios"

// Base axios instance
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // change if needed
  headers: {
    "Content-Type": "application/json"
  }
})
interface CustomEndpoints {
  create?: string
  getAll?: string
  getById?: string
  update?: string
  delete?: string
}

// Generic resource API factory
export const createResourceApi = <T>(
  resourcePath: string,
  customEndpoints?: CustomEndpoints
) => {
  return {
    create: async (data: T) => {
      const url = customEndpoints?.create
        ? `/${resourcePath}/${customEndpoints.create}`
        : `/${resourcePath}`
      try {
        const response = await api.post(url, data)
        return response.data
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || error.message)
        }
        throw new Error("An unexpected error occurred")
      }
    },

    getAll: async (companyId:string) => {
      try {
        const url = customEndpoints?.getAll
          ? `/${resourcePath}/${customEndpoints.getAll}?companyId=${companyId}`
          : `/${resourcePath}?companyId=${companyId}`
console.log("custom",customEndpoints)

        const response = await api.get(url)
        return response.data
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || error.message)
        }
        throw new Error("An unexpected error occurred")
      }
    },

    getById: async (id: string) => {
      try {
        const response = await api.get(`/${resourcePath}/${id}`)
        return response.data
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || error.message)
        }
        throw new Error("An unexpected error occurred")
      }
    },

    update: async (
      params: { id: string; companyId?: string; branchId?: string },
      data: Partial<T>
    ) => {
      try {
        let url: string
        if (customEndpoints?.update) {
          url = `/${resourcePath}/${customEndpoints.update}/${params.id}`
        } else {
          url = `/${resourcePath}/${params.id}`
        }
        const query = new URLSearchParams()
        if (params.companyId) query.append("companyId",params.companyId)
        if (params.branchId) query.append("branchId",params.branchId)
        if (query.toString()) {
          url += `?${query.toString()}`
        }
        const response = await api.put(url, data)
        return response.data
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || error.message)
        }
        throw new Error("An unexpected error occurred")
      }
    },

    delete: async (params: {
      id: string
      companyId?: string
      branchId?: string
    }) => {
      try {
        let url: string

        if (customEndpoints?.delete) {
          // If custom endpoint is provided
          url = `/${resourcePath}/${customEndpoints.delete}/${params.id}`
        } else {
          // Default endpoint
          url = `/${resourcePath}/${params.id}`
        }

        // Add query params if companyId/branchId are passed
        const query = new URLSearchParams()
        if (params.companyId) query.append("companyId", params.companyId)
        if (params.branchId) query.append("branchId", params.branchId)

        if (query.toString()) {
          url += `?${query.toString()}`
        }

        console.log("DELETE url:", url)
        const response = await api.delete(url)
        return response.data
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || error.message)
        }
        throw new Error("An unexpected error occurred")
      }
    }
  }
}
