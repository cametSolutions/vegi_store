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
    <div className="flex flex-row flex-1 min-h-screen">
      {/* Left Side: Info and background image */}
      <div
        className="flex-1 hidden md:flex flex-col justify-center items-start bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/50 to-emerald-800/60"></div>
        <div className="relative z-10 p-12 text-white">
          <h2 className="text-4xl font-bold mb-2">Welcome Back!</h2>
          <p className="mb-4 text-lg">Join thousands of happy customers and enjoy fresh products every day.</p>
          <div className="mt-12 flex flex-col gap-4">
            <div>
              <span className="text-3xl font-bold">500+</span>
              <span className="block text-sm opacity-80 ml-2">Fresh Products</span>
            </div>
            <div>
              <span className="text-3xl font-bold">1000+</span>
              <span className="block text-sm opacity-80 ml-2">Happy Customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-gray-700 text-center">
            Sign In to Your Account
          </h2>
          <LoginForm onSubmit={login} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Login;
