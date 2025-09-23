import { useState, useCallback } from "react"
import { AuthState, LoginFormData, User } from "../types/auth"

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false
  })

  const login = useCallback(async (loginData: LoginFormData): Promise<User> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))
    try {
      // Replace with your backend API URL
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        throw new Error("Invalid credentials")
      }

      const data = await response.json()

      // Assuming API returns { user: {id, name, email, role}, token }
      const user: User = data.user

      // Save token and user in localStorage for persistence
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(user))

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
      return user
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      throw error // Pass error to component
    }
  }, [])

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }, [])

  return {
    ...authState,
    login,
    logout
  }
}
