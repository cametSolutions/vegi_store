import { Outlet } from "react-router-dom"

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      <main className="flex-1 flex">
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout