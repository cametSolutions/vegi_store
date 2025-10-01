import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { unitOptions } from "../utils/transactionUtils";
import { itemMasterQueries } from "../../../hooks/queries/useItem";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

const AddItemForm = ({
  newItem,
  onNewItemChange,
  products,
  onProductSelect,
  onAddItem,
  branch,
  company,
}) => {
  const [searchTerm, setSearchTerm] = useState(newItem.code || "");
  const [shouldSearch, setShouldSearch] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // TanStack Query - enabled based on shouldSearch flag
  const {
    data: foundProduct,
    isFetching,
    isError,
  } = useQuery({
    ...itemMasterQueries.search(debouncedSearchTerm, company, branch, 25),
    enabled: shouldSearch && debouncedSearchTerm.trim() !== "", // Enable when search is triggered
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Update form fields if found
  useEffect(() => {
    if (shouldSearch && !isFetching) {
      if (foundProduct) {
        onNewItemChange({
          ...newItem,
          code: debouncedSearchTerm,
          name: foundProduct.name || "",
          unit: foundProduct.unit || "",
          rate: foundProduct.rate || "",
        });
        setShowNotFound(false);
        setShouldSearch(false); // Reset after successful search
      } else if (!foundProduct) {
        // Update code but show not found
        onNewItemChange({
          ...newItem,
          code: debouncedSearchTerm,
        });
        setShowNotFound(true);
        setShouldSearch(false); // Reset after search
      }
    }
    // eslint-disable-next-line
  }, [foundProduct, isFetching, shouldSearch]);

  // Handle Tab on code field
  const handleCodeKeyDown = (e) => {
    if (e.key === "Tab" && searchTerm.trim() !== "") {
      e.preventDefault(); // Prevent default tab behavior
      setShowNotFound(false);
      setShouldSearch(true); // Trigger search
    }
  };

  // Handle code input change
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowNotFound(false);
    
    // Update newItem.code immediately for other logic
    onNewItemChange({ ...newItem, code: value });
  };

  return (
    <div className="bg-white shadow-sm px-3 mt-1 py-3 ">
      <div className="grid grid-cols-6 gap-2 items-end">
        {/* CODE INPUT */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Code
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={handleCodeChange}
            onKeyDown={handleCodeKeyDown}
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="V001"
          />
          {isFetching && (
            <span className="text-blue-600 text-[9px]">Searching...</span>
          )}
          {showNotFound && !isFetching && (
            <span className="text-red-600 text-[9px]">Item not found</span>
          )}
        </div>

        {/* NAME */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={newItem.name}
            onChange={(e) =>
              onNewItemChange({ ...newItem, name: e.target.value })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="Name"
          />
        </div>

        {/* UNIT */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Unit
          </label>
          <select
            value={newItem.unit}
            onChange={(e) =>
              onNewItemChange({ ...newItem, unit: e.target.value })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
          >
            {unitOptions.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        {/* QTY */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Qty
          </label>
          <input
            type="number"
            value={newItem.qty}
            onChange={(e) =>
              onNewItemChange({
                ...newItem,
                qty: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* RATE */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Rate
          </label>
          <input
            type="number"
            value={newItem.rate}
            onChange={(e) =>
              onNewItemChange({
                ...newItem,
                rate: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={onAddItem}
          className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddItemForm;