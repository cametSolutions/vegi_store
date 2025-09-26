import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";

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
      <Route path="sale/create" element={<CreateTransaction />} />
      {/* Add more transaction routes here */}
    </Route>
  );
}
