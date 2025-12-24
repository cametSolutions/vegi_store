// hooks/useStockAdjustmentListActions.js
import { useState, useCallback, useMemo } from "react";

export const useStockAdjustmentListActions = () => {
  const [sortField, setSortField] = useState("adjustmentDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate totals from the data (will be used with real data from API)
  const calculateTotals = useCallback((adjustments) => {
    if (!adjustments || adjustments.length === 0) {
      return {
        totalAmount: 0,
        totalItemsAdjusted: 0,
        totalAddAdjustments: 0,
        totalRemoveAdjustments: 0,
      };
    }

    const totals = adjustments.reduce(
      (acc, adjustment) => {
        acc.totalAmount += parseFloat(adjustment?.totalAmount || 0);
        acc.totalItemsAdjusted += adjustment?.items?.length || 0;
        
        if (adjustment?.adjustmentType === "add") {
          acc.totalAddAdjustments++;
        } else if (adjustment?.adjustmentType === "remove") {
          acc.totalRemoveAdjustments++;
        }

        return acc;
      },
      {
        totalAmount: 0,
        totalItemsAdjusted: 0,
        totalAddAdjustments: 0,
        totalRemoveAdjustments: 0,
      }
    );

    return totals;
  }, []);

  // Action handlers
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleRefresh = useCallback(async () => {
    console.log("Refreshing stock adjustment list...");
    // This will be handled by React Query refetch
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Stock adjustment list refreshed");
  }, []);

  const handleExport = useCallback((data) => {
    console.log("Exporting stock adjustment list:", data);
    // Add your export logic here (CSV, Excel, PDF, etc.)
    
    // Example CSV export
    if (data && data.length > 0) {
      const headers = ["Date", "Reference", "Type", "Items", "Total Amount"];
      const csvData = data.map((adjustment) => [
        adjustment.adjustmentDate,
        adjustment.reference || adjustment.adjustmentNumber || "N/A",
        adjustment.adjustmentType === "add" ? "ADD" : "REMOVE",
        adjustment.items?.length || 0,
        adjustment.totalAmount?.toFixed(2) || "0.00",
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stock-adjustments-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }, []);

  const getAdjustmentTypeColor = (type) => {
    switch (type) {
      case "add":
        return "bg-green-100 text-green-800";
      case "remove":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAdjustmentTypeIcon = (type) => {
    switch (type) {
      case "add":
        return "⊕";
      case "remove":
        return "⊖";
      default:
        return "•";
    }
  };

  return {
    // State
    sortField,
    sortDirection,
    searchTerm,

    // Utility functions
    calculateTotals,
    getAdjustmentTypeColor,
    getAdjustmentTypeIcon,

    // Actions
    handleSort,
    handleSearchChange,
    handleRefresh,
    handleExport,
  };
};
