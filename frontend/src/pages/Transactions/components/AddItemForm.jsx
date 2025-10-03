import React, { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { units } from "../../../../constants/units";
import { itemMasterQueries } from "../../../hooks/queries/item.queries";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { truncate } from "../../../../../shared/utils/string";

const AddItemForm = ({
  onAddItem,
  branch,
  company,
  priceLevel,
}) => {
  // Local state for form fields
  const [localItem, setLocalItem] = useState({
    code: "",
    name: "",
    unit: units[0]?.value || "",
    qty: 0,
    rate: 0,
    availableStock: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // TanStack Query - enabled based on shouldSearch flag
  const {
    data: searchResponse,
    isFetching,
    isError,
    error,
  } = useQuery({
    ...itemMasterQueries.search(debouncedSearchTerm, company, branch, 25),
    enabled: shouldSearch && debouncedSearchTerm.trim() !== "",
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Show error toast when there's a backend error
  useEffect(() => {
    if (isError && error) {
      toast.error("Search Error", {
        description:  "Failed to search for item. Please try again.",
      });
      setShouldSearch(false);
    }
  }, [isError, error]);

  // Update form fields if found
  useEffect(() => {
    if (shouldSearch && !isFetching) {
      // Check if API response has data array with items
      if (searchResponse?.data && searchResponse.data.length > 0) {
        const foundProduct = searchResponse.data[0];
        
        // Find the appropriate rate based on priceLevel
        let rate = "";
        if (foundProduct.priceLevels && foundProduct.priceLevels.length > 0) {
          if (priceLevel) {
            const priceLevelData = foundProduct.priceLevels.find(
              (pl) => pl.priceLevel._id === priceLevel || 
                      pl.priceLevel.priceLevelName === priceLevel
            );
            rate = priceLevelData?.rate || foundProduct.priceLevels[0].rate;
          } else {
            rate = foundProduct.priceLevels[0].rate;
          }
        }

        // Find current stock for the branch
        let currentStock = "";
        if (foundProduct.stock && foundProduct.stock.length > 0) {
          const branchStock = foundProduct.stock.find(
            (s) => s.branch._id === branch
          );
          currentStock = branchStock?.currentStock || "";
        }

        setLocalItem({
          ...localItem,
          code: foundProduct.itemCode || debouncedSearchTerm,
          name: foundProduct.itemName || "",
          unit: foundProduct.unit || "",
          rate: rate || "",
          availableStock: currentStock,
        });
        setShowDropdown(false);
        setShouldSearch(false);
      } else {
        // No items found - show dropdown
        setLocalItem({
          ...localItem,
          code: debouncedSearchTerm,
        });
        setShowDropdown(true);
        setShouldSearch(false);
      }
    }
    // eslint-disable-next-line
  }, [searchResponse, isFetching, shouldSearch]);

  // Handle Tab on code field
  const handleCodeKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      e.preventDefault();
      setShowDropdown(false);
      setShouldSearch(true);
    }
  };

  // Handle code input change
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(false);
    setLocalItem({ ...localItem, code: value });
  };

  // Handle add button click
  const handleAddClick = () => {
    // Validate before adding
    if (!localItem.code || !localItem.name) {
      toast.error("Validation Error", {
        description: "Please fill in code and name fields",
      });
      return;
    }

    // Pass the item to parent
    onAddItem(localItem);

    // Reset local state
    setLocalItem({
      code: "",
      name: "",
      unit: units[0]?.value || "",
      qty: 0,
      rate: 0,
      availableStock: "",
    });
    setSearchTerm("");
    setShowDropdown(false);
  };

  return (
    <div className="bg-white shadow-sm px-3 mt-1 py-3 ">
      <div className="grid grid-cols-6 gap-2 items-end">
        {/* CODE INPUT */}
        <div className="relative">
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Code
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleCodeChange}
              onKeyDown={handleCodeKeyDown}
              className="w-full px-1.5 py-1 pr-6 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
              placeholder="V001"
            />
            {isFetching && (
              <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-600 animate-spin" />
            )}
          </div>
          
          {/* Dropdown for "Not Found" */}
          {showDropdown && !isFetching && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-300 rounded shadow-lg">
              <div className="px-2 py-1.5 text-[9px] text-red-600 border-b border-slate-200">
                Product not found
              </div>
              <div className="px-2 py-1.5 text-[9px] text-slate-600">
                <span className="font-medium">"{truncate(debouncedSearchTerm,10)}"</span> does not exist in inventory
              </div>
            </div>
          )}
        </div>

        {/* NAME */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            type="text"
            disabled
            value={localItem.name}
            onChange={(e) =>
              setLocalItem({ ...localItem, name: e.target.value })
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
            value={localItem.unit}
            onChange={(e) =>
              setLocalItem({ ...localItem, unit: e.target.value })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
          >
            {units.map((unit) => (
              <option key={unit?.value} value={unit?.value}>
                {unit?.displayName}
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
            value={localItem.qty}
            onChange={(e) =>
              setLocalItem({
                ...localItem,
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
            value={localItem.rate}
            onChange={(e) =>
              setLocalItem({
                ...localItem,
                rate: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={handleAddClick}
          className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddItemForm;