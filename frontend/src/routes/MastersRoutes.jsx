import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";

// const PriceLevel = lazy(() => import("../pages/Master/PriceLevel"));
// const CompanyMaster = lazy(() => import("../pages/Master/CompanyMaster"));
// const BranchMaster = lazy(() => import("../pages/Master/BranchMaster"));
// const UserMaster = lazy(() => import("../pages/Master/UserMaster"));
// const CompanyList = lazy(() => import("../pages/List/CompanyList"));
// const BranchList = lazy(() => import("../pages/List/BranchList"));
// const UserList = lazy(() => import("../pages/List/UserList"));
// const AccountMaster = lazy(() => import("../pages/Master/AccountMaster"));
// const ItemMaster = lazy(() => import("../pages/Master/ItemMaster"));
const ItemMasterPanel = lazy(() => import("../pages/Master/ItemMaster/ItemMasterPanel"));
const RateSetting = lazy(() => import("../pages/Master/RateSetting/RateSetting"));
const PriceLevelPanel = lazy(() => import("../pages/Master/PriceLevelMaster/PriceLevelPanel"));
const AccountMasterPanel = lazy(() => import("../pages/Master/AccountMaster/AccountMasterPanel"));

const CompanyMasterPanel = lazy(() => import("../pages/Master/CompanyMaster/CompanyMasterPanel"));
const BranchMasterPanel = lazy(() => import("../pages/Master/BranchMaster/BranchMasterPanel"));

export default function MastersRoutes() {
  return (
    <Route
      path="master"
      element={
        <ProtectedRoute>
          <Outlet /> {/* Renders child routes */}
        </ProtectedRoute>
      }
    >
      <Route path="item-master" element={<ItemMasterPanel />} />
      <Route path="price-level" element={<PriceLevelPanel />} />
      <Route path="rate-setting" element={<RateSetting />} />
      <Route path="account-master" element={<AccountMasterPanel />} />
      <Route path="company-master" element={<CompanyMasterPanel />} />
            <Route path="branch-master" element={<BranchMasterPanel />} />

      {/* <Route path="price-level" element={<PriceLevel />} />
      <Route path="company" element={<CompanyList />} />
      <Route path="branch" element={<BranchList />} />
      <Route path="user" element={<UserList />} />
      <Route path="companyRegistration" element={<CompanyMaster />} />
      <Route path="branchRegistration" element={<BranchMaster />} />
      <Route path="userRegistration" element={<UserMaster />} />
      <Route path="accountMaster" element={<AccountMaster />} /> */}
    </Route>
  );
}
