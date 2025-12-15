// src/hooks/queries/outstandingQueries.js
import { queryOptions } from "@tanstack/react-query";
import { outstandingService } from "../../api/services/outstandingService ";

export const outstandingQueries = {
  all: () => ["outstanding"],

  // Get all customers with outstanding balances
  customersList: (companyId, branchId, dateRange = null) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "customers-list",
        companyId,
        branchId,
        dateRange?.start, // Changed from startDate
        dateRange?.end,   // Changed from endDate
      ],
      queryFn: () => {
        const params = {};
        if (dateRange?.start) {
          // Convert to ISO string for API
          params.startDate = new Date(dateRange.start).toISOString();
        }
        if (dateRange?.end) {
          // Set to end of day and convert to ISO string
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString();
        }
        
        return outstandingService.getCustomersList(companyId, branchId, params);
      },
      enabled: Boolean(companyId && branchId),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),

  // Get outstanding details for a specific customer with pagination
  customerDetails: (
    companyId,
    branchId,
    customerId,
    outstandingType = "all",
    dateRange = null,
    page = 1,
    limit = 20
  ) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "customer-details",
        companyId,
        branchId,
        customerId,
        outstandingType,
        dateRange?.start,
        dateRange?.end,
        page,
        limit,
      ],
      queryFn: () => {
        const params = {
          outstandingType: outstandingType !== "all" ? outstandingType : undefined,
          page,
          limit,
        };
        
        if (dateRange?.start) {
          params.startDate = new Date(dateRange.start).toISOString();
        }
        if (dateRange?.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString();
        }

        return outstandingService.getCustomerDetails(
          companyId,
          branchId,
          customerId,
          params
        );
      },
      enabled: Boolean(companyId && branchId && customerId),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),

  // Get outstanding report (optional)
  report: (companyId, branchId, params = {}) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "report",
        companyId,
        branchId,
        params,
      ],
      queryFn: () => outstandingService.getReport(companyId, branchId, params),
      enabled: Boolean(companyId && branchId),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),

  // Get outstanding summary (optional)
  summary: (companyId, branchId, params = {}) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "summary",
        companyId,
        branchId,
        params,
      ],
      queryFn: () =>
        outstandingService.getSummary(companyId, branchId, params),
      enabled: Boolean(companyId && branchId),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),

  // Export to Excel
  exportExcel: (companyId, branchId, customerId, params = {}) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "export-excel",
        companyId,
        branchId,
        customerId,
        params,
      ],
      queryFn: () =>
        outstandingService.exportToExcel(
          companyId,
          branchId,
          customerId,
          params
        ),
      enabled: false,
    }),

  // Export to PDF
  exportPDF: (companyId, branchId, customerId, params = {}) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "export-pdf",
        companyId,
        branchId,
        customerId,
        params,
      ],
      queryFn: () =>
        outstandingService.exportToPDF(companyId, branchId, customerId, params),
      enabled: false,
    }),
};
