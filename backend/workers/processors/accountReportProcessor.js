// workers/processors/accountReportProcessor.js
import {
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists
} from '../../services/accountLeger/accountLegerService.js';
import AccountLedger from '../../model/AccountLedgerModel.js';
import { toObjectId, generateFileName, parseDateFilters, buildBaseMatch } from '../utils/reportUtils.js';

export async function processAccountReport(job) {
  const { format, filters } = job.data;
  
  await job.updateProgress(10);

  const { parsedStartDate, parsedEndDate } = parseDateFilters(filters.startDate, filters.endDate);
  const singleAccount = filters.account ? toObjectId(filters.account) : null;

  await job.updateProgress(20);

  const baseMatch = buildBaseMatch(filters, parsedStartDate, parsedEndDate);
  if (singleAccount) baseMatch.account = singleAccount;

  const accountIdsForCheck = await AccountLedger.distinct('account', baseMatch);

  if (accountIdsForCheck.length === 0) {
    return {
      data: [],
      fileName: generateFileName(format, 'account-summary', parsedStartDate, parsedEndDate),
      recordCount: 0,
    };
  }

  await job.updateProgress(30);

  const dirtyStatus = await checkIfDirtyPeriodExists(
    filters.company, 
    filters.branch, 
    accountIdsForCheck.map(id => id.toString()),
    parsedStartDate, 
    parsedEndDate
  );

  await job.updateProgress(40);

  let serviceResult;
  const page = 1;
  const limit = 999999;
  const summaryOnly = false;

  if (!dirtyStatus.isDirty) {
    serviceResult = await getSimpleLedgerReport(
      filters.company, filters.branch, parsedStartDate, parsedEndDate,
      filters.transactionType || null, page, limit, filters.searchTerm?.trim() || null,
      singleAccount, summaryOnly
    );
  } else if (dirtyStatus.isDirty && !dirtyStatus.needsFullRefold) {
    serviceResult = await getHybridLedgerReport(
      filters.company, filters.branch, parsedStartDate, parsedEndDate,
      filters.transactionType || null, page, limit, filters.searchTerm?.trim() || null,
      singleAccount, summaryOnly
    );
  } else {
    serviceResult = await refoldLedgersWithAdjustments(
      filters.company, filters.branch, parsedStartDate, parsedEndDate,
      filters.transactionType || null, page, limit, filters.searchTerm?.trim() || null,
      singleAccount, summaryOnly
    );
  }

  await job.updateProgress(80);

  const shapedItems = serviceResult.items.map(item => ({
    accountId: item.accountId,
    accountName: item.accountName,
    email: item.email || null,
    phoneNo: item.phoneNo || null,
    openingBalance: item.openingBalance,
    totalDebit: item.summary.totalDebit,
    totalCredit: item.summary.totalCredit,
    closingBalance: item.summary.closingBalance,
    transactionCount: item.summary.transactionCount,
    breakdown: item.summary.breakdown,
    transactions: item.transactions || [],
  }));

  await job.updateProgress(100);

  return {
    data: shapedItems,
    fileName: generateFileName(format, 'account-summary', parsedStartDate, parsedEndDate),
    recordCount: shapedItems.length,
  };
}
