// src/hooks/queries/outstandingQueries.js
import { queryOptions } from "@tanstack/react-query";
import { outstandingService } from "../../api/services/outstandingService ";

export const outstandingQueries = {
  all: () => ["outstanding"],

  // Get all customers with outstanding balances
  customersList: (companyId, branchId, params = {}) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "customers-list",
        companyId,
        branchId,
        params,
      ],
      queryFn: () =>
        outstandingService.getCustomersList(companyId, branchId, params),
      enabled: Boolean(companyId && branchId),
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),

  // Get outstanding details for a specific customer
  customerDetails: (companyId, branchId, customerId, outstandingType = 'all') =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "customer-details",
        companyId,
        branchId,
        customerId,
        outstandingType,
      ],
      queryFn: () =>
        outstandingService.getCustomerDetails(companyId, branchId, customerId, {
          outstandingType,
        }),
      enabled: Boolean(companyId && branchId && customerId),
      staleTime: 30 * 1000, // 30 seconds
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
      queryFn: () =>
        outstandingService.getReport(companyId, branchId, params),
      enabled: Boolean(companyId && branchId),
      staleTime: 30 * 1000, // 30 seconds
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
      staleTime: 30 * 1000, // 30 seconds
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
        outstandingService.exportToExcel(companyId, branchId, customerId, params),
      enabled: false, // Don't auto-fetch, trigger manually
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
      enabled: false, // Don't auto-fetch, trigger manually
    }),
};