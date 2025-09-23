import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import "./App.css"
import MainLayout from "./components/Layout/MainLayout"
import AuthLayout from "./components/Layout/AuthLayout"
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
  return (
    <Routes>
      {/* Routes without header (Auth Layout) */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Routes with header (Main Layout) */}
      <Route element={<MainLayout />}>
        <Route path="admin/masters/price-level" element={<PriceLevel />} />
        <Route path="admin/masters/company" element={<CompanyList />} />
        <Route path="admin/masters/branch" element={<BranchList />} />
        <Route path="admin/masters/user" element={<UserList />} />
        <Route
          path="/admin/masters/companyRegistration"
          element={<CompanyMaster />}
        />
        <Route
          path="/admin/masters/branchRegistration"
          element={<BranchMaster />}
        />
        <Route
          path="/admin/masters/userRegistration"
          element={<UserMaster />}
        />
        <Route
          path="/admin/masters/accountMaster"
          element={<AccountMaster />}
        />
        <Route path="admin/master/item-master" element={<ItemMaster />} />
      </Route>
    </Routes>
  )
}

export default App