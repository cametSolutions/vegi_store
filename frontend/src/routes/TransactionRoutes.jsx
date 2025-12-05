import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";
import TransactionPanel from "@/pages/Transactions/TransactionPanel";
import CashTransactionPanel from "@/pages/CashTransaction/CashTransactionPanel";


export default function TransactionRoutes() {
  return (
    <Route
      path="transactions"
      element={
        <ProtectedRoute>
          <Outlet /> {/* Renders child routes */}
        </ProtectedRoute>
      }
    >
      <Route path="sale/create" element={<TransactionPanel />} />
      <Route path="purchase/create" element={<TransactionPanel />} />
      <Route path="purchase_return/create" element={<TransactionPanel />} />
      <Route path="sales_return/create" element={<TransactionPanel />} />
      <Route path="receipt/create" element={<CashTransactionPanel />} />
      <Route path="payment/create" element={<CashTransactionPanel />} />
      {/* Add more transaction routes here */}
    </Route>
  );
}
