// components/AppliedFilters.jsx
import { clearAllFilters, clearFilter } from "@/store/slices/filtersSlice";
import { CircleX } from "lucide-react";
import React from "react";
import { useSelector, useDispatch } from "react-redux";


const filterLabels = {
  startDate: "Start",
  endDate: "End",
  transactionType: "Transaction",
  outstandingType: "Outstanding",
};

const valueFormatters = {
  // if you want to map codes to labels later, do it here
  transactionType: (value) => value,
  outstandingType: (value) => value,
};

const AppliedFilters = () => {
  const filters = useSelector((state) => state.filters);
  const dispatch = useDispatch();

  const activeEntries = Object.entries(filters).filter(
    ([, value]) => value !== null && value !== "" && value !== undefined
  );

  if (activeEntries.length === 0) return null;

  const handleClearAll = () => {
    dispatch(clearAllFilters());
  };

  const formatValue = (key, value) => {
    const formatter = valueFormatters[key];
    return formatter ? formatter(value) : value;
  };

  return (
    <div className="flex items-center justify-between gap-2  p-2 px-4 shadow-sm ">
      <div className="flex flex-wrap gap-2 text-xs">
        {activeEntries.map(([key, value]) => (
          <button
            key={key}
            onClick={() => dispatch(clearFilter(key))}
            className="px-2 py-1 bg-gray-100 border border-gray-300 rounded-sm text-xs flex items-center gap-1 hover:bg-gray-200 text-[10px]"
          >
            <span className="font-medium ">
              {filterLabels[key] || key}:
            </span>
            <span>{formatValue(key, value)}</span>
            <span className="text-gray-500">×</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleClearAll}
        className="text-xs "
      >
        <CircleX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AppliedFilters;
