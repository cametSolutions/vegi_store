// pages/RateSetting.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { itemMasterQueries } from "../../../hooks/queries/item.queries";
import { priceLevelQueries } from "../../../hooks/queries/priceLevel.queries";
import { itemMasterMutations } from "../../../hooks/mutations/itemMasterMutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Check,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Plus,
  RefreshCw,
  LoaderCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { truncate } from "../../../../../shared/utils/string";

// Constants
const DEBOUNCE_DELAY = 500;
const AUTO_SAVE_DELAY = 1500;
const SUCCESS_DISPLAY_DURATION = 2000;
const MIN_COLUMNS = 10;

// Reusable Components
const PageHeader = ({ searchTerm, onSearchChange, disabled }) => (
  <div className="flex-shrink-0">
    <h2 className="text-sm font-bold shadow-lg p-2 px-4">Rate Setting</h2>
    <div className="relative">
      <Search
        size={17}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <Input
        placeholder="Search items..."
        value={searchTerm}
        onChange={onSearchChange}
        disabled={disabled}
        className={`pl-10 rounded-none ${disabled ? "bg-gray-50" : ""}`}
      />
      {searchTerm && !disabled && (
        <button
          type="button"
          onClick={() => onSearchChange({ target: { value: "" } })}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
);

const CenteredState = ({ icon: Icon, title, description, action, iconColor = "text-gray-600" }) => (
  <div className="flex items-center justify-center flex-1 bg-gray-50">
    <div className="text-center max-w-md p-8">
      <div className={`w-20 h-20 ${iconColor.replace('text-', 'bg-').replace('-600', '-100')} rounded-full flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-600 mb-6">{description}</p>}
      {action}
    </div>
  </div>
);

const RateSetting = () => {
  const queryClient = useQueryClient();
  const selectedCompanyFromStore = useSelector((state) => state.companyBranch?.selectedCompany);
  const selectedBranchFromStore = useSelector((state) => state.companyBranch?.selectedBranch);

  const [searchTerm, setSearchTerm] = useState("");
  const [editedRates, setEditedRates] = useState({});
  const [savingCells, setSavingCells] = useState(new Set());
  const [focusedItem, setFocusedItem] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Queries
  const {
    data: priceLevelsResponse,
    isLoading: isPriceLevelLoading,
    isError: isPriceLevelError,
    refetch: refetchPriceLevels,
  } = useQuery({
    ...priceLevelQueries.getAll(selectedCompanyFromStore?._id, selectedBranchFromStore?._id),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading: isItemsLoading,
    isFetchingNextPage,
    isError: isItemsError,
    refetch: refetchItems,
  } = useInfiniteQuery(
    itemMasterQueries.list(selectedCompanyFromStore?._id, debouncedSearchTerm)
  );

  const updateRateMutation = useMutation(itemMasterMutations.updateRate(queryClient));

  // Memoized data with dummy columns
  const allItems = useMemo(() => data?.pages?.flatMap((page) => page.data.items) || [], [data]);
  const realPriceLevels = useMemo(() => priceLevelsResponse?.data || [], [priceLevelsResponse]);
  
  const priceLevels = useMemo(() => {
    const levels = [...realPriceLevels];
    const dummyCount = Math.max(0, MIN_COLUMNS - realPriceLevels.length);
    
    for (let i = 0; i < dummyCount; i++) {
      levels.push({
        _id: `dummy-${i}`,
        priceLevelName: `Price Level ${realPriceLevels.length + i + 1}`,
        isDummy: true
      });
    }
    
    return levels;
  }, [realPriceLevels]);

  const gridTemplateColumns = `256px repeat(${priceLevels.length}, 192px)`;

  // Helper functions
  const getRate = useCallback(
    (itemId, priceLevelId) => {
      const editedData = editedRates[itemId]?.[priceLevelId];
      if (editedData !== undefined) return editedData.value;

      const item = allItems.find((i) => i._id === itemId);
      const priceLevel = item?.priceLevels?.find(
        (pl) => pl.priceLevel === priceLevelId || pl.priceLevel?._id === priceLevelId
      );
      return priceLevel?.rate || "";
    },
    [allItems, editedRates]
  );

  const getCellStatus = useCallback(
    (itemId, priceLevelId) => {
      const cellKey = `${itemId}-${priceLevelId}`;
      if (savingCells.has(cellKey)) return "saving";

      const editedData = editedRates[itemId]?.[priceLevelId];
      if (editedData?.status === "saved") return "saved";
      if (editedData?.status === "error") return "error";
      if (editedData !== undefined) return "edited";

      return "default";
    },
    [editedRates, savingCells]
  );

  const getCellStyle = (status) => {
    const styles = {
      edited: "border-yellow-400 bg-yellow-50",
      saving: "border-blue-400 bg-blue-50",
      saved: "border-green-400 bg-green-50",
      error: "border-red-400 bg-red-50",
      default: "",
    };
    return styles[status] || "";
  };

  const getCellIcon = (status) => {
    const icons = {
      saving: <Loader2 className="w-3 h-3 animate-spin text-blue-600" />,
      saved: <Check className="w-3 h-3 text-green-600" />,
      error: <AlertCircle className="w-3 h-3 text-red-600" />,
    };
    return icons[status] || null;
  };

  const clearEditedRate = useCallback((itemId, priceLevelId) => {
    setEditedRates((prev) => {
      const newRates = { ...prev };
      if (newRates[itemId]) {
        delete newRates[itemId][priceLevelId];
        if (Object.keys(newRates[itemId]).length === 0) {
          delete newRates[itemId];
        }
      }
      return newRates;
    });
  }, []);

  // Auto-save handler
  const handleAutoSave = useCallback(
    async (itemId, priceLevelId, value) => {
      const cellKey = `${itemId}-${priceLevelId}`;

      if (value === "") {
        clearEditedRate(itemId, priceLevelId);
        return;
      }

      const numericRate = parseFloat(value);
      if (isNaN(numericRate) || numericRate < 0) {
        setEditedRates((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            [priceLevelId]: { ...prev[itemId]?.[priceLevelId], status: "error" },
          },
        }));
        toast.error("Rate must be a positive number");
        return;
      }

      setSavingCells((prev) => new Set([...prev, cellKey]));

      try {
        await updateRateMutation.mutateAsync({ itemId, priceLevelId, rate: numericRate });

        setEditedRates((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            [priceLevelId]: { ...prev[itemId]?.[priceLevelId], status: "saved" },
          },
        }));

        toast.success("Rate saved", { duration: 1500 });

        setTimeout(() => clearEditedRate(itemId, priceLevelId), SUCCESS_DISPLAY_DURATION);
      } catch (error) {
        setEditedRates((prev) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            [priceLevelId]: { ...prev[itemId]?.[priceLevelId], status: "error" },
          },
        }));
        toast.error(error.message || "Failed to save rate");
      } finally {
        setSavingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }
    },
    [updateRateMutation, clearEditedRate]
  );

  const handleRateChange = useCallback(
    (itemId, priceLevelId, value) => {
      if (editedRates[itemId]?.[priceLevelId]?.timeoutId) {
        clearTimeout(editedRates[itemId][priceLevelId].timeoutId);
      }

      const item = allItems.find((i) => i._id === itemId);
      const priceLevel = item?.priceLevels?.find(
        (pl) => pl.priceLevel === priceLevelId || pl.priceLevel?._id === priceLevelId
      );
      const originalValue = priceLevel?.rate || "";

      const timeoutId = setTimeout(() => handleAutoSave(itemId, priceLevelId, value), AUTO_SAVE_DELAY);

      setEditedRates((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [priceLevelId]: { value, originalValue, status: "edited", timeoutId },
        },
      }));
    },
    [allItems, editedRates, handleAutoSave]
  );

  const handleBlur = useCallback(
    (itemId, priceLevelId) => {
      const editedData = editedRates[itemId]?.[priceLevelId];

      if (editedData?.status === "edited") {
        if (editedData.timeoutId) clearTimeout(editedData.timeoutId);
        handleAutoSave(itemId, priceLevelId, editedData.value);
      }

      setFocusedItem(null);
    },
    [editedRates, handleAutoSave]
  );

  const handleScroll = useCallback(
    (e) => {
      if (hasNextPage && !isFetchingNextPage) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
          fetchNextPage();
        }
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(editedRates).forEach((itemRates) => {
        Object.values(itemRates).forEach((rateData) => {
          if (rateData.timeoutId) clearTimeout(rateData.timeoutId);
        });
      });
    };
  }, [editedRates]);

  // Loading State
  if (isPriceLevelLoading || isItemsLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-white">
        <PageHeader searchTerm="" onSearchChange={() => {}} disabled />
        <CenteredState
          icon={LoaderCircle}
          title="Loading data..."
          iconColor="text-gray-600 animate-spin"
        />
      </div>
    );
  }

  // Error States
  if (isPriceLevelError) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-white">
        <PageHeader searchTerm="" onSearchChange={() => {}} disabled />
        <CenteredState
          icon={AlertTriangle}
          title="Failed to Load Price Levels"
          iconColor="text-red-600"
          action={
            <Button onClick={() => refetchPriceLevels()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (isItemsError) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-white">
        <PageHeader
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
        />
        <CenteredState
          icon={AlertTriangle}
          title="Failed to Load Items"
          iconColor="text-red-600"
          action={
            <Button onClick={() => refetchItems()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  // Empty State - No Price Levels
  if (realPriceLevels.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-white">
        <PageHeader searchTerm="" onSearchChange={() => {}} disabled />
        <CenteredState
          icon={AlertCircle}
          title="No Price Levels Found"
          description="You need to create price levels before you can set rates for items. Price levels help you manage different pricing tiers for your products."
          iconColor="text-blue-600"
          action={
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Price Level
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-white">
      <style>{`
        .rate-grid-container {
          display: grid;
          grid-template-columns: ${gridTemplateColumns};
          overflow: auto;
          max-height: calc(100vh - 150px);
        }

        .rate-grid-cell {
          display: flex;
          align-items: center;
          min-height: 56px;
          padding: 12px;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .rate-grid-cell.dummy {
          background-color: #f9fafb;
        }

        .rate-grid-header {
          position: sticky;
          top: 0;
          background-color: #94a3b8;
          color: white;
          font-weight: 600;
          font-size: 12px;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 12px;
          border-right: 1px solid #64748b;
          border-bottom: 1px solid #64748b;
        }

        .rate-grid-header.dummy {
          background-color: #cbd5e1;
          color: #64748b;
        }

        .rate-grid-item-name {
          position: sticky;
          left: 0;
          background-color: white;
          z-index: 10;
          font-size: 12px;
          font-weight: 500;
        }

        .rate-grid-item-name.focused {
          background-color: #dbeafe;
          border-color: #93c5fd;
        }

        .rate-grid-item-name.header {
          z-index: 30;
          background-color: #94a3b8;
          color: white;
          font-weight: 600;
        }

        .rate-grid-cell.focused {
          background-color: #dbeafe;
        }

        .rate-grid-cell:hover:not(.dummy) {
          background-color: #f9fafb;
        }

        .rate-grid-cell.focused:hover {
          background-color: #dbeafe;
        }
      `}</style>

      <PageHeader
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="rate-grid-container" onScroll={handleScroll}>
        {/* Header Row */}
        <div className="rate-grid-header rate-grid-item-name header">Item Name</div>
        {priceLevels.map((priceLevel) => (
          <div 
            key={priceLevel._id} 
            className={`rate-grid-header ${priceLevel.isDummy ? 'dummy' : ''}`}
          >
            {priceLevel.priceLevelName}
          </div>
        ))}

        {/* Empty State - No Items */}
        {allItems.length === 0 && !isFetchingNextPage ? (
          <div className="flex items-center justify-center py-16 bg-gray-50" style={{ gridColumn: `1 / -1` }}>
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">No items found</p>
              <p className="text-xs text-gray-500">
                {searchTerm ? `Try adjusting your search term "${searchTerm}"` : "No items available to display"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {allItems.map((item) => (
              <React.Fragment key={item._id}>
                <div className={`rate-grid-cell rate-grid-item-name ${focusedItem === item._id ? "focused" : ""}`}>
                  <div>
                    <div className="font-semibold">{truncate(item.itemName,20)}</div>
                    <div className="text-gray-500 text-[10px] mt-1">
                      {(item.itemCode)} • {item.unit}
                    </div>
                  </div>
                </div>

                {priceLevels.map((priceLevel) => {
                  if (priceLevel.isDummy) {
                    return (
                      <div key={priceLevel._id} className="rate-grid-cell dummy">
                        <div className="flex gap-1 items-center w-full">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              disabled
                              className="text-xs h-8 rounded bg-gray-100 cursor-not-allowed"
                              placeholder="--"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const status = getCellStatus(item._id, priceLevel._id);
                  const cellStyle = getCellStyle(status);
                  const icon = getCellIcon(status);

                  return (
                    <div key={priceLevel._id} className={`rate-grid-cell ${focusedItem === item._id ? "focused" : ""}`}>
                      <div className="flex gap-1 items-center w-full">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={getRate(item._id, priceLevel._id)}
                            onChange={(e) => handleRateChange(item._id, priceLevel._id, e.target.value)}
                            onFocus={() => setFocusedItem(item._id)}
                            onBlur={() => handleBlur(item._id, priceLevel._id)}
                            className={`text-xs h-8 rounded pr-8 transition-colors ${cellStyle}`}
                            placeholder="0.00"
                            disabled={status === "saving"}
                          />
                          {icon && <div className="absolute right-2 top-1/2 transform -translate-y-1/2">{icon}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-8 bg-gray-50" style={{ gridColumn: `1 / -1` }}>
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Loading more items...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RateSetting;