import axios from "axios";
import { CompanyFormData } from "@/pages/Master/CompanyMaster";
// Create a base axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api/company",
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to create a new company
export const createCompany = async (data: CompanyFormData) => {
  try {
    const response = await api.post("/createcompanies", data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Function to get all companies
export const getCompanies = async () => {
  try {
    const response = await api.get("/companies");
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message);
  }
};
