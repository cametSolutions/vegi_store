import { Route, Routes, useLocation } from "react-router-dom"
import Login from "./pages/Login"
import "./App.css"
import Header from "./components/Layout/Header"
import PriceLevel from "./pages/Master/PriceLevel"
import CompanyMaster from "./pages/Master/CompanyMaster"
import CompanyList from "./pages/List/CompanyList"
function App() {
  const location = useLocation()

  // List of routes where header should NOT appear
  const hideHeaderRoutes = ["/"]

  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      {shouldShowHeader && <Header />}
      <main className="flex-1 flex">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/price-level" element={<PriceLevel />} />
          {/* <Route path="/admin/homePge" element={<HomePage />} /> */}
          <Route path="/masters/company" element={<CompanyList />} />
          <Route
            path="/admin/masters/companyRegistration"
            element={<CompanyMaster />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
