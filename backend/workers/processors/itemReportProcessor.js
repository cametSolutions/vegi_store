// workers/processors/itemReportProcessor.js
import {
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists
} from '../../services/itemLedger/ItemLedgerService.js';
import ItemLedger from '../../model/ItemsLedgerModel.js';
import { toObjectId, generateFileName, parseDateFilters, buildBaseMatch } from '../utils/reportUtils.js';

/**
 * Background processor for Item Summary Reports
 * Handles large datasets by offloading to a worker queue
 */
export async function processItemReport(job) {
    
  const { format, filters } = job.data;
  
  await job.updateProgress(10);

  // 1. Parse Dates & Filters
  const { parsedStartDate, parsedEndDate } = parseDateFilters(filters.startDate, filters.endDate);
  
  // 2. Build Base Match to find relevant items
  const baseMatch = {
    company: toObjectId(filters.company), // Note: job payload usually has company
    branch: toObjectId(filters.branch),
    transactionDate: { $gte: parsedStartDate, $lte: parsedEndDate },
  };

  // Apply Transaction Type Filter (Same logic as controller)
  if (filters.transactionType === "sale") {
    baseMatch.transactionType = { $in: ["sale", "sales_return"] };
  } else if (filters.transactionType === "purchase") {
    baseMatch.transactionType = { $in: ["purchase", "purchase_return"] };
  }

  // Handle Search Term (if provided, we need to filter items first, 
  // but for a background report, we typically dump all data unless specifically filtered)
  // If search is critical for the download, you'd need to look up item IDs here first.
  // For now, we assume the report typically wants ALL items in the date range.

  await job.updateProgress(20);

  // 3. Get distinct Item IDs involved in this period
  const itemIdsForCheck = await ItemLedger.distinct("item", baseMatch);

  if (itemIdsForCheck.length === 0) {
    return {
      data: [],
      fileName: generateFileName(format, 'item-summary', parsedStartDate, parsedEndDate),
      recordCount: 0,
    };
  }

  await job.updateProgress(30);

  // 4. Check Dirty Status (Smart Routing)
  const dirtyStatus = await checkIfDirtyPeriodExists({
    company: filters.company,
    branch: filters.branch,
    itemIds: itemIdsForCheck.map(id => id.toString()),
    startDate: parsedStartDate,
    endDate: parsedEndDate
  });

    console.log("dirtyStatus:", dirtyStatus);


  await job.updateProgress(40);

  // 5. Execute Appropriate Service Strategy
  let serviceResult;
  // For exports, we usually want ALL pages, so we set a very high limit
  const page = 1;
  const limit = 999999; 

  if (!dirtyStatus.isDirty) {
    // PATH 1: FAST PATHcompany
    serviceResult = await getSimpleLedgerReport({
      company: filters.company,
      branch: filters.branch,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      transactionType: filters.transactionType || null,
      page,
      limit,
      searchTerm: filters.search?.trim() || null,
    });
  } else if (dirtyStatus.isDirty && !dirtyStatus.needsFullRefold) {
    // PATH 2: HYBRID PATH
    serviceResult = await getHybridLedgerReport({
      company: filters.company,
      branch: filters.branch,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      transactionType: filters.transactionType || null,
      page,
      limit,
      searchTerm: filters.search?.trim() || null,
    });
  } else {
    // PATH 3: FULL REFOLD
    serviceResult = await refoldLedgersWithAdjustments({
      company: filters.company,
      branch: filters.branch,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      transactionType: filters.transactionType || null,
      page,
      limit,
      searchTerm: filters.search?.trim() || null,
    });
  }

  await job.updateProgress(80);

  console.log("serviceResult:", serviceResult);
  

  // 6. Shape Data for Export
  // We flatten the structure so it's ready for Excel/PDF generation
  const shapedItems = serviceResult.items.map(item => {
    const { summary } = item;
    return {
      itemId: item._id,
      itemName: item.itemName,
      itemCode: item.itemCode || '-',
      unit: item.unit,
      openingQuantity: item.openingQuantity || 0,
      
      // Stock Movements
      totalIn: summary.totalIn || 0,
      totalOut: summary.totalOut || 0,
      amountIn: summary.amountIn || 0,
      amountOut: summary.amountOut || 0,
      
      // Closing Metrics
      closingQuantity: summary.closingQuantity || 0,
      lastPurchaseRate: summary.lastPurchaseRate || 0,
      closingBalance: summary.closingBalance || 0,
      transactionCount: summary.transactionCount || 0,
      
      // We generally don't include raw transactions array in a summary export 
      // to keep file size manageable, but can be added if 'Detailed' report is requested.
    };
  });

  await job.updateProgress(100);

  return {
    data: shapedItems,
    fileName: generateFileName(format, 'item-summary', parsedStartDate, parsedEndDate),
    recordCount: shapedItems.length,
  };
}
