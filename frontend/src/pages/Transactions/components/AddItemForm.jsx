import React, { useState, useEffect, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { units } from "../../../../constants/units";
import { itemMasterQueries } from "../../../hooks/queries/item.queries";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { truncate } from "../../../../../shared/utils/string";
import { NumericFormat } from "react-number-format";

const AddItemForm = ({
  items,
  branch,
  company,
  priceLevel,
  updateTransactionField,
  addItem,
  clickedItemInTable,
}) => {
  // Local state for form fields
  const [localItem, setLocalItem] = useState({
    item: null,
    itemCode: "",
    itemName: "",
    unit: units[0]?.value || "",
    quantity: "0",
    rate: "0",
    taxable: false, // boolean to indicate if item is taxable (default false)
    taxRate: "0", // string, tax rate percent (e.g., "5" for 5%)
    taxAmount: "0", // string, calculated tax baseAmount for the item
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const codeInputRef = useRef(null);

  // TanStack Query - enabled based on shouldSearch flag
  const {
    data: searchResponse,
    isFetching,
    isError,
    error,
  } = useQuery({
    ...itemMasterQueries.search(debouncedSearchTerm, company, branch, 25, true),
    enabled: shouldSearch && debouncedSearchTerm.trim() !== "",
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Show error toast when there's a backend error
  useEffect(() => {
    if (isError && error) {
      toast.error("Search Error", {
        description: "Failed to search for item. Please try again.",
      });
      setShouldSearch(false);
    }
  }, [isError, error]);

  // Update form fields if found
  useEffect(() => {
    if (shouldSearch && !isFetching) {
      if (searchResponse?.data && searchResponse.data.length > 0) {
        const foundProduct = searchResponse.data[0];

        // Find the appropriate rate based on priceLevel
        let rate = "";
        if (foundProduct.priceLevels && foundProduct.priceLevels.length > 0) {
          if (priceLevel) {
            const priceLevelData = foundProduct.priceLevels.find(
              (pl) =>
                pl.priceLevel._id === priceLevel ||
                pl.priceLevel.priceLevelName === priceLevel
            );
            rate = priceLevelData?.rate || 0;
          } else {
            rate = 0;
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

        // Update localItem, including rate
        setLocalItem((prev) => ({
          ...prev,
          item: foundProduct?._id,
          itemCode: foundProduct.itemCode || debouncedSearchTerm,
          itemName: foundProduct.itemName || "",
          priceLevels: foundProduct.priceLevels || [],
          unit: foundProduct.unit || "",
          rate: rate.toString() || "",
          taxable: false,
          taxRate: "0",
          taxAmount: "0",
          // availableStock: currentStock,
        }));
        setShowDropdown(false);
        setShouldSearch(false);
      } else {
        // No items found - show dropdown
        setLocalItem((prev) => ({
          ...prev,
          itemCode: debouncedSearchTerm,
        }));
        setShowDropdown(true);
        setShouldSearch(false);
      }
    }
    // Include priceLevel as a dependency
    // eslint-disable-next-line
  }, [searchResponse, isFetching, shouldSearch]);

  useEffect(() => {
    if (!localItem.item) return; // No item loaded, no update needed

    // Find the loaded product from the last searchResponse (or maintain it separately)

    const foundProduct = searchResponse?.data[0];

    if (!foundProduct || !foundProduct.priceLevels) return;

    let newRate = "";
    if (priceLevel) {
      const priceLevelData = foundProduct.priceLevels.find(
        (pl) =>
          pl.priceLevel._id === priceLevel ||
          pl.priceLevel.priceLevelName === priceLevel
      );
      newRate = priceLevelData?.rate || "0";
    } else {
      newRate = "0";
    }

    // Update the localItem rate if it differs from current
    if (localItem.rate !== newRate.toString()) {
      setLocalItem((prev) => ({
        ...prev,
        rate: newRate.toString(),
      }));
    }
  }, [priceLevel, localItem.item, searchResponse]);

  /// if an item form table is clicked on, set the localItem to the clicked item
  useEffect(() => {
    if (clickedItemInTable) {
      const {
        item,
        itemCode,
        itemName,
        unit,
        quantity,
        rate,
        taxable,
        taxRate,
        taxAmount,
      } = clickedItemInTable;

      setLocalItem((prev) => ({
        ...prev,
        item,
        itemCode,
        itemName,
        unit,
        quantity,
        rate,
        taxable,
        taxRate,
        taxAmount,
      }));
      codeInputRef.current.focus();
    }
  }, [clickedItemInTable]);

  // Handle Tab on itemCode field
  const handleCodeKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      e.preventDefault();
      setShowDropdown(false);
      setShouldSearch(true);
    }
  };

  // Handle itemCode input change
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(false);
    setLocalItem({ ...localItem, itemCode: value });
  };

  // Handle Enter key on quantity field
  const handleQuantityKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddClick();
    }
  };

  // Handle Enter key on rate field
  const handleRateKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddClick();
    }
  };

  // Handle add button click
  const handleAddClick = () => {
    if (!localItem.itemCode || !localItem.itemName || !localItem.item) {
      toast.error("Validation Error", {
        description: "Please fill in itemCode and itemName fields",
      });
      return;
    }

    const newItems = addItem(items, localItem);
    updateTransactionField("items", newItems);

    setLocalItem({
      item: null,
      itemCode: "",
      itemName: "",
      unit: units[0]?.value || "",
      priceLevels: [],
      quantity: "0",
      rate: "0",
      baseAmount: "0",
      amountAfterTax: "0",
      taxable: false, // boolean to indicate if item is taxable (default false)
      taxRate: "0", // string, tax rate percent (e.g., "5" for 5%)
      taxAmount: "0", // string, calculated tax baseAmount for the item
    });
    setSearchTerm("");
    codeInputRef.current.focus();
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
              ref={codeInputRef}
              type="text"
              value={searchTerm}
              onChange={handleCodeChange}
              onKeyDown={handleCodeKeyDown}
              className="w-full px-1.5 py-1 pr-6 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500"
              placeholder="V001"
            />
            {isFetching && (
              <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-600 animate-spin" />
            )}
          </div>

          {/* Dropdown for "Not Found" */}
          {showDropdown && !isFetching && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-300 rounded-xs shadow-lg">
              <div className="px-2 py-1.5 text-[9px] text-red-600 border-b border-slate-200">
                Product not found
              </div>
              <div className="px-2 py-1.5 text-[9px] text-slate-600">
                <span className="font-medium">
                  "{truncate(debouncedSearchTerm, 10)}"
                </span>{" "}
                does not exist in inventory
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
            value={localItem.itemName}
            onChange={(e) =>
              setLocalItem({ ...localItem, itemName: e.target.value })
            }
            className="w-full px-1.5 py-1 border border-slate-300 bg-slate-200  text-[9px] focus:ring-1 focus:ring-blue-500"
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
            className="w-full px-1.5 py-1 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500"
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
          <NumericFormat
            // type="number"
            value={localItem.quantity}
            allowLeadingZeros={false}
            allowNegative={false}
            decimalScale={3}
            onKeyDown={handleQuantityKeyDown}
            onChange={(e) =>
              setLocalItem({
                ...localItem,
                quantity: e.target.value || "0",
              })
            }
            className="w-full px-1.5 py-1 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* RATE */}
        <div>
          <label className="block text-[9px] font-medium text-slate-700 mb-1">
            Rate
          </label>
          <NumericFormat
            value={localItem.rate.toString()}
            allowLeadingZeros={false}
            allowNegative={false}
            // decimalScale={2}
            // prefix="₹"
            fixedDecimalScale
            onKeyDown={handleRateKeyDown}
            onChange={(e) => {
              setLocalItem({
                ...localItem,
                rate: e.target.value || "0",
              });
            }}
            // onValueChange={(values) => {
            //   const { floatValue } = values;
            //   setLocalItem({
            //     ...localItem,
            //     rate: floatValue || "0",
            //   });
            // }}
            className="w-full px-1.5 py-1 border border-slate-300 rounded-xs text-[9px] focus:ring-1 focus:ring-blue-500"
            placeholder="₹0.00"
          />
        </div>

        {/* ADD BUTTON */}
        <button
          onClick={handleAddClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddClick();
            }
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded-xs flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddItemForm;
