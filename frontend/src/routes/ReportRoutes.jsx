import { Outlet, Route } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "../components/Layout/ProtectedRoute";
import TransactionPanel from "@/pages/Transactions/TransactionPanel";
import CashTransactionPanel from "@/pages/CashTransaction/CashTransactionPanel";
import ItemLedgerDashboard from "@/pages/Reports/itemReports/dev/ItemLedgerDashboard";
import ItemMonthlyBalanceDashboard from "@/pages/Reports/itemReports/dev/ItemMonthlyBalanceDashboard";
import AccountLedgerDashboard from "@/pages/Reports/accountReports/AccountLedgerDashboard";
import AccountMonthlyBalanceDashboard from "@/pages/Reports/accountReports/AccountMonthlyBalanceDashboard";
import OutstandingReport from "@/pages/Reports/outstandingReports/OutstandingReport";

import TransactionSummary from "@/pages/Reports/TransactionSummary/TransactionSummary";
import ItemSummary from "@/pages/Reports/itemReports/org/ItemSummary";
import OutstandingSummary from "@/pages/Reports/outstandingReports/OutstandingSummary";

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
      <Route path="items-summary" element={<ItemSummary />} />
      <Route
        path="item-monthly-report"
        element={<ItemMonthlyBalanceDashboard />}
      />
      {/* Account reports  */}

      <Route path="account-report" element={<AccountLedgerDashboard />} />
      <Route
        path="account-monthly-report"
        element={<AccountMonthlyBalanceDashboard />}
      />
      <Route path="outstanding-report" element={<OutstandingReport />} />
      <Route path="outstanding-summary" element={<OutstandingSummary />} />
      <Route
        path="transaction-summary/:transactionType"
        element={<TransactionSummary />}
      />

      {/* Add more transaction routes here */}
    </Route>
  );
}
