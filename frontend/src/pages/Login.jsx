import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/queries/auth.queries";
import { getLocalStorageItem } from "@/helper/localstorage";
import { useEffect } from "react";
import bgImage from "@/assets/3403.webp";

const Login = () => {
  const { isLoading, login } = useAuth();
  const navigate = useNavigate();
  const userData = getLocalStorageItem("user");

  useEffect(() => {
    if (userData) navigate("/");
  }, [navigate, userData]);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center   relative flex items-center justify-end"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/25"></div>

      {/* Glass Login Card */}
      <div className="relative z-10 mr-10 md:mr-24 w-[360px] rounded-2xl bg-white/25 border border-white/40 shadow-xl p-6">
        <LoginForm onSubmit={login} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Login; 