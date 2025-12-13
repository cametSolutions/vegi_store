import { queryOptions } from "@tanstack/react-query";
import { transactionSummaryService } from "../../../src/api/services/transactionSummary.service ";

export const transactionSummaryQueries = {
  all: () => ["transactionSummary"],

  // Get transaction summary
  summary: (companyId, branchId, transactionType, params = {}) =>
    queryOptions({
      queryKey: [
        ...transactionSummaryQueries.all(),
        "summary",
        companyId,
        branchId,
        transactionType,
        params,
      ],
      queryFn: () =>
        transactionSummaryService.getSummary(
          companyId,
          branchId,
          transactionType,
          params
        ),
      enabled: Boolean(companyId && branchId && transactionType),
      staleTime: 5 * 60 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      
      placeholderData: (previousData) => previousData,
    }),

  // Export to Excel
  exportExcel: (companyId, branchId, transactionType, params = {}) =>
    queryOptions({
      queryKey: [
        ...transactionSummaryQueries.all(),
        "export-excel",
        companyId,
        branchId,
        transactionType,
        params,
      ],
      queryFn: () =>
        transactionSummaryService.exportToExcel(
          companyId,
          branchId,
          transactionType,
          params
        ),
      enabled: false, // Don't auto-fetch, trigger manually
    }),

  // Export to PDF
  exportPDF: (companyId, branchId, transactionType, params = {}) =>
    queryOptions({
      queryKey: [
        ...transactionSummaryQueries.all(),
        "export-pdf",
        companyId,
        branchId,
        transactionType,
        params,
      ],
      queryFn: () =>
        transactionSummaryService.exportToPDF(
          companyId,
          branchId,
          transactionType,
          params
        ),
      enabled: false, // Don't auto-fetch, trigger manually
    }),
};