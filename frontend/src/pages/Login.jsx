import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/queries/auth.queries";
import { getLocalStorageItem } from "@/helper/localstorage";

import bgImage from "@/assets/3403.webp";
import { FloatingBackground } from "@/components/animation/FloatingBackground";

const Login = () => {
  const { isLoading, login } = useAuth();
  const navigate = useNavigate();
  const userData = getLocalStorageItem("user");

  useEffect(() => {
    if (userData) navigate("/");
  }, [navigate, userData]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-900">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 grayscale-[20%]"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      
      {/* Animated Elements */}
      <FloatingBackground />

      {/* Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[400px] px-4"
      >
        <div className="relative overflow-hidden rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur-xl border border-white/20 ring-1 ring-white/10">
          {/* Shine Effect */}
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/20 to-transparent rotate-45 transform translate-x-full animate-shine pointer-events-none" />
          
          <LoginForm onSubmit={login} isLoading={isLoading} />
        </div>

        {/* Footer Credit */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-xs text-white/40"
        >
          Secure Wholesale Management System &copy; 2026
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
