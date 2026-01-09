import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Leaf, Eye, EyeOff, ArrowRight } from "lucide-react";
import { setLocalStorageItem } from "../helper/localstorage";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const LoginForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ... (Keep your existing validateForm logic here) ...
  const validateForm = () => {
    // Paste your existing validation logic here
    return true; // placeholder
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const loggedUser = await onSubmit(formData);
      setLocalStorageItem("user", loggedUser);
      navigate("/home-page");
      toast.success("Welcome back!");
    } catch (error) {
      setErrors({ general: "Invalid credentials" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center mb-10">
        <div className="inline-flex relative mb-4">
          <div className="bg-gradient-to-tr from-green-500 to-emerald-400 p-4 rounded-2xl shadow-lg shadow-green-500/30">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-white/20"
          />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
        <p className="text-white/60 text-sm mt-2">Manage your inventory efficiently</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Alert */}
        {errors.general && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
          >
            {errors.general}
          </motion.div>
        )}

        {/* Email Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label className="text-xs font-medium text-green-100/80 ml-1">Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-green-400 text-white/40">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="block w-full pl-10 pr-3 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 backdrop-blur-sm hover:bg-black/30"
              placeholder="admin@vegsys.com"
            />
          </div>
        </motion.div>

        {/* Password Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <div className="flex justify-between ml-1">
            <label className="text-xs font-medium text-green-100/80">Password</label>
            <a href="#" className="text-xs text-green-400 hover:text-green-300 transition-colors">Forgot?</a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-green-400 text-white/40">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="block w-full pl-10 pr-10 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 backdrop-blur-sm hover:bg-black/30"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>

        {/* Login Button */}
        <motion.div variants={itemVariants} className="pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-green-900/40 hover:shadow-green-900/60 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Verifying...
              </span>
            ) : (
              <>
                Sign In 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
};
