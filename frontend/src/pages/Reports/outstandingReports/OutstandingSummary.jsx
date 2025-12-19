// src/pages/Outstanding/OutstandingSummary.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";

import OutstandingPartiesList from "./OutstandingPartiesList";
import OutstandingTransactionsList from "./OutstandingTransactionsList";

const OutstandingSummary = () => {
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
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Please select a company and branch</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-104px)] flex bg-gray-50 gap-1">
      <OutstandingPartiesList
        companyId={companyId}
        branchId={branchId}
        selectedParty={selectedParty}
        onSelectParty={setSelectedParty}
      />

      <OutstandingTransactionsList
        companyId={companyId}
        branchId={branchId}
        selectedParty={selectedParty}
      />
    </div>
  );
};

export default OutstandingSummary;
