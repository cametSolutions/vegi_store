// pages/ItemMasterPanel.jsx
import React, { useState } from "react";
import ItemMasterForm from "./ItemMasterForm";
import ItemsList from "./ItemsList";

const ItemMasterPanel = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditMode(true);
  };

  const handleFormSuccess = () => {
    setSelectedItem(null);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setIsEditMode(false);
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]     ">
      {/* Left Panel - Form */}
      <div className="w-1/2 overflow-y-auto border  bg-white shadow border-r-4">
        <ItemMasterForm
          selectedItem={selectedItem}
          isEditMode={isEditMode}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </div>

      {/* Right Panel - List */}
      <div className="w-1/2  border   bg-white shadow">
        <ItemsList onEdit={handleEdit} />
      </div>
    </div>
  );
};

export default ItemMasterPanel;
