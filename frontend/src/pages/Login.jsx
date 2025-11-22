import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/queries/auth.queries";
import { getLocalStorageItem } from "@/helper/localstorage";
import { useEffect } from "react";

const Login = () => {
  const { isLoading, login } = useAuth();
  const navigate = useNavigate();
  const userData = getLocalStorageItem("user");

  useEffect(() => {
    if (userData) {
      navigate("/");
    }
  }, [navigate, userData]);

  return (
    <div className="flex min-h-screen">
      {/* Left: Clean Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white">
        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-1 text-center">
            Veg Shop <span className="font-light">Login</span>
          </h2>
          <LoginForm onSubmit={login} isLoading={isLoading} />
          <div className="mt-8 text-center text-gray-400 text-base">
            Let’s Get Things Done!
          </div>
        </div>
      </div>
      {/* Right: Clean image with overlay & tagline */}
      <div className="hidden md:flex flex-1 items-center justify-center relative min-h-screen">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" // Replace with a fresh-vegetable image
          alt="Vegetables"
          className="object-cover h-full w-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute left-8 bottom-1/3 text-white z-10">
          <h2 className="text-4xl font-bold mb-2">
            Your Gateway <br />
            to Freshness
          </h2>
          <p className="text-2xl">Admin Access for Veggie Excellence</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
