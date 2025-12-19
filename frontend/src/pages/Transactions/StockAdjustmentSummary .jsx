import React from "react";

const StockAdjustmentSummary = ({ totalAmount }) => {
  return (
    <div className="bg-white shadow-sm p-1">
      <div className="grid grid-cols-5 gap-4 text-sm">
        <div className="col-span-4"></div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Total:</span>
          <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentSummary;
