// src/pages/Outstanding/AccountStatement.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import OutstandingPartiesList from "../../outstandingReports/OutstandingPartiesList";
import AccountStatementDetail from "./AccountStatementDetail";


const AccountStatement = () => {
  const selectedCompany = useSelector(
    (state) => state?.companyBranch?.selectedCompany
  );
  const selectedBranch = useSelector(
    (state) => state?.companyBranch?.selectedBranch
  );

  const companyId = selectedCompany?._id;
  const branchId = selectedBranch?._id;

  const [selectedParty, setSelectedParty] = useState(null);

  if (!companyId || !branchId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-104px)]">
        <p className="text-slate-500 text-sm">Please select a company and branch</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-104px)] flex bg-white overflow-hidden">
      {/* Left Side: Party List */}
      <div className="flex-none z-10 shadow-lg">
        <OutstandingPartiesList
          companyId={companyId}
          branchId={branchId}
          selectedParty={selectedParty}
          onSelectParty={setSelectedParty}
          fetchFullAccounts={true}
        />
      </div>

      {/* Right Side: Account Statement Detail */}
      <div className="flex-1 min-w-0 bg-slate-50 relative">
        <AccountStatementDetail 
          companyId={companyId}
          branchId={branchId}
          selectedParty={selectedParty}
        />
      </div>
    </div>
  );
};

export default AccountStatement;
