import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";
import TransactionPanel from "@/pages/Transactions/TransactionPanel";

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
      {/* Add more transaction routes here */}
    </Route>
  );
}
