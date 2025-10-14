import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";
import TransactionPanel from "@/pages/Transactions/TransactionPanel";
import CashTransactionPanel from "@/pages/CashTransaction/CashTransactionPanel";
const CreateTransaction = lazy(() =>
  import("../pages/Transactions/CreateTransaction")
);

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
      <Route path="receipt/create" element={<CashTransactionPanel />} />
      <Route path="payment/create" element={<CashTransactionPanel />} />
      {/* Add more transaction routes here */}
    </Route>
  );
}
