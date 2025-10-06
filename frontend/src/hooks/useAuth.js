import { api } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useAuth = () => {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const queryClient = useQueryClient();

  const login = useCallback(async (loginData) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await api.post("/auth/login", loginData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // same as fetch's credentials: "include"
      });

      const { user } = response.data;

      // Save user in localStorage
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));

      // Axios puts server errors inside error.response
      if (error.response) {
        console.error("Login failed:", error.response.data);
        throw new Error(error.response.data?.message || "Invalid credentials");
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call backend to clear auth cookie
      await api.post(
        "/auth/logout",
        {},
        { withCredentials: true } // important for cookie
      );
    } catch (error) {
      console.error("Logout  failed:", error);
      // Even if backend fails, still clear frontend state
    }

    // Clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("companyBranches");
    localStorage.removeItem("selectedBranch");
    localStorage.removeItem("selectedCompany");

    // Clear react-query cache
    queryClient.clear();

    // Reset auth state
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Redirect to login page
    toast.success("Logged out successfully")
    window.location.href = "/login";
  }, [queryClient]);

  return {
    ...authState,
    login,
    logout,
  };
};
