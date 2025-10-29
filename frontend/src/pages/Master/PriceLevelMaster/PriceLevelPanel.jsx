import React, { useState } from "react";
import PriceLevelForm from "./PriceLevelForm";
import PriceLevelList from "./PriceLevelList";

const PriceLevelPanel = ({ companyId, branchId }) => {
  const [editingPriceLevel, setEditingPriceLevel] = useState(null);

  return (
    <div className="flex flex-row  bg-gray-50 rounded-lg overflow-hidden shadow-md h-[calc(100vh-var(--header-height))]">
      <div className="flex-1 border-r bg-white overflow-y-auto">
        <PriceLevelForm
          editingPriceLevel={editingPriceLevel}
          onClearEdit={() => setEditingPriceLevel(null)}
        />
      </div>
      <div className="flex-1 bg-gray-50 ">
        <PriceLevelList onEdit={setEditingPriceLevel} />
      </div>
    </div>
  );
};

export default PriceLevelPanel;
