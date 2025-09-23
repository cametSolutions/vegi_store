
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "../components/LoginForm"
import { useAuth } from "../hooks/useAuth"
const Login = () => {
  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")
  const navigate = useNavigate()
const {user,isAuthenticated,isLoading,login,logout}=useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (email === "admin@example.com" && password === "1234") {
      navigate("/")
    } else {
      alert("Invalid credentials")
    }
  }

  return (
   
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Hero Image */}
      <div className="w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-800/40 z-10"></div>
        <img
          src="https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Fresh vegetables at market"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 text-white">
        
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-80 mt-1">Fresh Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1000+</div>
              <div className="text-sm opacity-80 mt-1">Happy Customers</div>
            </div>
          
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-100 rounded-full opacity-20"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-100 rounded-full opacity-20"></div>
          <div className="absolute top-1/3 -right-8 w-32 h-32 bg-orange-100 rounded-full opacity-15"></div>
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-10 backdrop-blur-sm border border-white/20">
            <LoginForm onSubmit={login} isLoading={isLoading} />
            
           
            {/* Demo Credentials */}
            {/* <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Demo Credentials:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Admin:</strong> admin@freshmarket.com / password123
                </p>
                <p>
                  <strong>Customer:</strong> customer@example.com / customer123
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
