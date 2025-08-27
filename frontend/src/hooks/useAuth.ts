import { useState, useCallback } from 'react';
import { AuthState, LoginFormData, User } from '../types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (loginData: LoginFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
 try {
      // Replace with your backend API URL
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      // Assuming API returns { user: {id, name, email, role}, token }
      const user: User = data.user;

      // Save token and user in localStorage for persistence
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error; // Pass error to component
    }
    // Simulate API call delay
    // await new Promise(resolve => setTimeout(resolve, 1500));

    // // Mock authentication - in real app, this would be an API call
    // if (loginData.email === 'admin@freshmarket.com' && loginData.password === 'password123') {
    //   setAuthState({
    //     user: mockUser,
    //     isAuthenticated: true,
    //     isLoading: false,
    //   });
    // } else if (loginData.email === 'customer@example.com' && loginData.password === 'customer123') {
    //   setAuthState({
    //     user: {
    //       ...mockUser,
    //       id: '2',
    //       email: 'customer@example.com',
    //       name: 'John Customer',
    //       role: 'customer',
    //     },
    //     isAuthenticated: true,
    //     isLoading: false,
    //   });
    // } else {
    //   setAuthState(prev => ({ ...prev, isLoading: false }));
    //   throw new Error('Invalid credentials');
    // }
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
};