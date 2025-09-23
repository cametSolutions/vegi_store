import { Outlet } from "react-router-dom"
import Header from "./Header"

function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      <Header />
      <main className="flex-1 flex  max-w-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout