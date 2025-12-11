import React, { useState } from "react";
import BranchMasterForm from "./BranchMasterForm";
import BranchMasterList from "./BranchMasterList";

const BranchMasterPanel = () => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  const handleEdit = (branchData) => {
    setEditingId(branchData._id);
    setEditData(branchData);
  };

  const clearEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <div className="w-1/2 overflow-y-auto border bg-white shadow border-r-2">
        <BranchMasterForm
          editingId={editingId}
          editData={editData}
          onClearEdit={clearEdit}
        />
      </div>
      <div className="w-1/2">
        <BranchMasterList onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default BranchMasterPanel;