import React, { useState, useEffect } from "react";
import AccountMasterForm from "./AccountMasterForm";
import { useSelector } from "react-redux";
import AccountMasterList from "./AccountMasterList";

const AccountMasterPanel = ({ companyId }) => {
  // State to hold currently editing record or null for create mode
  const [editingId, setEditingId] = useState(null);

  // To pass values into form when editing
  const [editData, setEditData] = useState(null);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany._id
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch._id
  );

  // When editing row clicked from the list
  const handleEdit = (accountData) => {
    setEditingId(accountData._id);
    setEditData(accountData);
  };

  // When form submission or cancel clears editing state
  const clearEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  return (
    <div className="flex  h-[calc(100vh-var(--header-height))] ">
      <div className="w-1/2 overflow-y-auto border  bg-white shadow border-r-2">
        <AccountMasterForm
          companyId={selectedCompanyFromStore}
          branchId={selectedBranchFromStore}
          editingId={editingId}
          editData={editData}
          onClearEdit={clearEdit}
        />
      </div>
      <div className="w-1/2">
        <AccountMasterList companyId={companyId} onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default AccountMasterPanel;
