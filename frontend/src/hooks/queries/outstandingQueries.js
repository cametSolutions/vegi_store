// src/hooks/queries/outstandingQueries.js
import { queryOptions } from "@tanstack/react-query";
import { outstandingService } from "../../api/services/outstandingService ";

export const outstandingQueries = {
  all: () => ["outstanding"],

  // Get all parties with combined outstanding (customers + suppliers netted)
   partiesList: (
    companyId,
    branchId,
    dateRange = null,
    page = 1,
    limit = 5,
    searchTerm = "",
    partyTypeFilter = "all"
  ) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "parties-list",
        companyId,
        branchId,
        dateRange?.start,
        dateRange?.end,
        page,
        limit,
        searchTerm,
        partyTypeFilter,
      ],
      queryFn: () => {
        const params = {
          page,
          limit,
        };

        if (searchTerm) {
          params.search = searchTerm;
        }

        if (partyTypeFilter !== "all") {
          params.partyType = partyTypeFilter;
        }

        if (dateRange?.start) {
          params.startDate = new Date(dateRange.start).toISOString();
        }
        if (dateRange?.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString();
        }

        return outstandingService.getPartiesList(companyId, branchId, params);
      },
      enabled: Boolean(companyId && branchId),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),


  // Get all customers/suppliers with outstanding balances (OLD - separate view)
  customersList: (companyId, branchId, dateRange = null, accountType = 'customer') =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "customers-list",
        companyId,
        branchId,
        dateRange?.start,
        dateRange?.end,
        accountType,
      ],
      queryFn: () => {
        const params = {
          accountType: accountType
        };
        
        if (dateRange?.start) {
          params.startDate = new Date(dateRange.start).toISOString();
        }
        if (dateRange?.end) {
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

  // Get outstanding details for a specific party
   partyDetails: (
    companyId,
    branchId,
    partyId,
    outstandingType = "all",
    dateRange = null,
    page = 1,
    limit = 20
  ) =>
    queryOptions({
      queryKey: [
        ...outstandingQueries.all(),
        "party-details",
        companyId,
        branchId,
        partyId,
        outstandingType,
        dateRange?.start,
        dateRange?.end,
        page,
        limit,
      ],
      queryFn: () => {
        const params = {
          page,
          limit,
        };

        if (outstandingType !== "all") {
          params.outstandingType = outstandingType;
        }

        if (dateRange?.start) {
          params.startDate = new Date(dateRange.start).toISOString();
        }
        if (dateRange?.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString();
        }

        return outstandingService.getPartyDetails(
          companyId,
          branchId,
          partyId,
          params
        );
      },
      enabled: Boolean(companyId && branchId && partyId),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      placeholderData: (previousData) => previousData,
    }),


  // Get outstanding details for a specific customer (OLD)
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
 
};
