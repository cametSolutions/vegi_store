import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";
import TransactionPanel from "@/pages/Transactions/TransactionPanel";
import CashTransactionPanel from "@/pages/CashTransaction/CashTransactionPanel";
import ItemLedgerDashboard from "@/pages/Reports/ItemLedgerDashboard";
import ItemMonthlyBalanceDashboard from "@/pages/Reports/ItemMonthlyBalanceDashboard";


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
      <Route path="item-report" element={<ItemLedgerDashboard />} />
      <Route path="item-monthly-report" element={<ItemMonthlyBalanceDashboard />} />
      {/* Add more transaction routes here */}
    </Route>
  );
}
