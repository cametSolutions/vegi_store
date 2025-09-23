import { Route, Routes, useLocation, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import "./App.css"
import Header from "./components/Layout/Header"
import PriceLevel from "./pages/Master/PriceLevel"
import CompanyMaster from "./pages/Master/CompanyMaster"
import BranchMaster from "./pages/Master/BranchMaster"
import UserMaster from "./pages/Master/UserMaster"
import CompanyList from "./pages/List/CompanyList"
import BranchList from "./pages/List/BranchList"
import UserList from "./pages/List/UserList"
import AccountMaster from "./pages/Master/AccountMaster"
import ItemMaster from "./pages/Master/ItemMaster"
function App() {
  const location = useLocation()

  // List of routes where header should NOT appear
  const hideHeaderRoutes = ["/", "/login"]

  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      {shouldShowHeader && <Header />}
      <main className="flex-1 flex">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/price-level" element={<PriceLevel />} />
          {/* <Route path="/admin/homePge" element={<HomePage />} /> */}
          <Route path="/masters/company" element={<CompanyList />} />
          <Route path="/masters/branch" element={<BranchList />} />
          <Route
            path="/admin/masters/companyRegistration"
            element={<CompanyMaster />}
          />
          <Route
            path="/admin/masters/branchRegistration"
            element={<BranchMaster />}
          />
          <Route path="/masters/user" element={<UserList />} />
          <Route
            path="/admin/masters/userRegistration"
            element={<UserMaster />}
          />
          <Route
            path="/admin/masters/accountMaster"
            element={<AccountMaster />}
          />
          <Route path="/master/item-master" element={<ItemMaster />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
