import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";
import TransactionPanel from "@/pages/Transactions/TransactionPanel";
import CashTransactionPanel from "@/pages/CashTransaction/CashTransactionPanel";
import ItemLedgerDashboard from "@/pages/Reports/itemReports/ItemLedgerDashboard";
import ItemMonthlyBalanceDashboard from "@/pages/Reports/itemReports/ItemMonthlyBalanceDashboard";
import AccountLedgerDashboard from "@/pages/Reports/accountReports/AccountLedgerDashboard";
import AccountMonthlyBalanceDashboard from "@/pages/Reports/accountReports/AccountMonthlyBalanceDashboard";
import OutstandingReport from "@/pages/Reports/outstandingReports/OutstandingReport";

export default function TransactionRoutes() {
  return (
    <Route
      path="reports"
      element={
        <ProtectedRoute>
          <Outlet /> {/* Renders child routes */}
        </ProtectedRoute>
      }
    >
      {/* item reports */}
      <Route path="item-report" element={<ItemLedgerDashboard />} />
      <Route
        path="item-monthly-report"
        element={<ItemMonthlyBalanceDashboard />}
      />
      {/* Account reports  */}

      <Route path="account-report" element={<AccountLedgerDashboard />} />
      <Route path="account-monthly-report" element={<AccountMonthlyBalanceDashboard />} />
      <Route path="outstanding-report" element={<OutstandingReport />} />

      {/* Add more transaction routes here */}
    </Route>
  );
}
