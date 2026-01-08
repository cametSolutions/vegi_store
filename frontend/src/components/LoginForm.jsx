import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Leaf, Eye, EyeOff } from "lucide-react";
import { setLocalStorageItem } from "../helper/localstorage";
import { toast } from "sonner";

export const LoginForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const loggedUser = await onSubmit(formData);
      setLocalStorageItem("user", loggedUser);

      navigate("/home-page");
      toast.success("Login successful");
      setErrors({});
    } catch (error) {
      console.log("Login failed", error);
      setErrors({
        general: "Invalid email or password. Please try again.",
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="w-full max-w-md ">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          <div className="relative">
            <div className="bg-green-500 p-4 rounded-full shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Small vegetable icons */}
        <div className="flex justify-center items-center space-x-4 mt-4 opacity-60">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-xs">🥕</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xs">🍅</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 text-xs">🍆</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-yellow-600 text-xs">🌽</span>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-white mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none  text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.email
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 text-white focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.password
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-white"
            >
              Remember me
            </label>
          </div>
      
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Sign Up Link */}
  
    </div>
  );
};