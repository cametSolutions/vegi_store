import React from "react";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const StockAdjustmentHeader = ({ date, adjustmentType, updateAdjustmentField }) => {
  const dateValue = date ? new Date(date) : new Date();

  const handleDateChange = (selectedDate) => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      updateAdjustmentField("adjustmentDate", formattedDate);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          Stock Adjustment
          <span className="text-xs font-normal text-slate-600">
            ({adjustmentType === "add_to_stock" ? "Add To Stock" : "Remove From Stock"})
          </span>
        </h1>
        <div className="text-xs text-slate-500 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center text-[11px] font-medium text-slate-700">
              <Calendar className="inline w-3 h-3 mr-1" />
              Date
            </label>
            <DatePicker
              selected={dateValue}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              className="px-2 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500 w-[100px]"
              calendarClassName="text-xs"
              popperPlacement="bottom-end"
              portalId="root"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentHeader;
