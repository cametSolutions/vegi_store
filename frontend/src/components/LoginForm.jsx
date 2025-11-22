// Only show labels and clean fields, no emojis
export const LoginForm = ({ onSubmit, isLoading = false }) => {
  // ...your state and handlers...

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-gray-700 mb-2 text-sm">Username</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
            focus:ring-green-500 focus:border-green-500 ${
              errors.email
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300"
            }`}
          placeholder="Enter your email"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-gray-700 mb-2 text-sm">Password</label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
            focus:ring-green-500 focus:border-green-500 ${
              errors.password
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300"
            }`}
          placeholder="Enter your password"
          disabled={isLoading}
        />
      </div>
      {/* General Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {errors.general}
        </div>
      )}
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
      >
        {isLoading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
};
