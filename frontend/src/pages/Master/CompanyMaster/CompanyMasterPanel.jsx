import React, { useState } from "react";
import CompanyMasterForm from "./CompanyMasterForm";
import CompanyMasterList from "./CompanyMasterList";

const CompanyMasterPanel = () => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);

  const handleEdit = (companyData) => {
    setEditingId(companyData._id);
    setEditData(companyData);
  };

  const clearEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <div className="w-1/2 overflow-y-auto border bg-white shadow border-r-2">
        <CompanyMasterForm
          editingId={editingId}
          editData={editData}
          onClearEdit={clearEdit}
        />
      </div>
      <div className="w-1/2">
        <CompanyMasterList onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default CompanyMasterPanel;
