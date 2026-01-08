// workers/processors/transactionReportProcessor.js
import mongoose from 'mongoose';
import { SalesModel, PurchaseModel, SalesReturnModel, PurchaseReturnModel } from '../../model/TransactionModel.js';
import { generateFileName, parseDateFilters, toObjectId } from '../utils/reportUtils.js';

// Map transaction types to their respective models
const TRANSACTION_MODELS = {
  sale: SalesModel,
  purchase: PurchaseModel,
  sales_return: SalesReturnModel,
  purchase_return: PurchaseReturnModel,
};

/**
 * Background processor for Transaction Summary Reports
 * Handles large datasets by offloading to a worker queue
 */
export async function processTransactionReport(job) {
  const { format, filters } = job.data;
  
  await job.updateProgress(10);

  // 1. Parse Dates & Filters
  const { parsedStartDate, parsedEndDate } = parseDateFilters(filters.startDate, filters.endDate);
  
  // 2. Validate Transaction Type
  const transactionType = filters.transactionType;
  if (!TRANSACTION_MODELS[transactionType]) {
    throw new Error(`Invalid transaction type: ${transactionType}`);
  }

  const Model = TRANSACTION_MODELS[transactionType];

  await job.updateProgress(20);

  // 3. Build Query Match
  const query = {
    company: toObjectId(filters.company),
    branch: toObjectId(filters.branch),
    transactionType: transactionType,
  };

  // Date Filter
  if (parsedStartDate || parsedEndDate) {
    query.transactionDate = {};
    if (parsedStartDate) {
      query.transactionDate.$gte = parsedStartDate;
    }
    if (parsedEndDate) {
      query.transactionDate.$lte = parsedEndDate;
    }
  }

  // Search Filter
  if (filters.search) {
    query.$or = [
      { transactionNumber: { $regex: filters.search, $options: "i" } },
      { accountName: { $regex: filters.search, $options: "i" } },
      { email: { $regex: filters.search, $options: "i" } },
    ];
  }

  await job.updateProgress(30);

  // 4. Fetch Transactions (Stream optimized or standard find)
  // Since this is for a file export, we typically fetch ALL matching records.
  // We use .lean() for performance.
  const transactions = await Model.find(query)
    .select(
      "transactionNumber transactionDate accountName phone email netAmount totalAmountAfterTax status paymentStatus"
    )
    .sort({ transactionDate: -1, createdAt: -1 })
    .lean();

  await job.updateProgress(60);

  // 5. Calculate Total Amount (Optional for summary header)
  // We can calculate this in memory since we already fetched the docs, 
  // or use an aggregation if we wanted to avoid fetching all docs first (but we need them for the file anyway).
  const totalAmount = transactions.reduce((sum, txn) => sum + (txn.netAmount || 0), 0);

  await job.updateProgress(80);

  // 6. Shape Data for Export
  // Ensure dates and numbers are clean
  const shapedTransactions = transactions.map(txn => ({
    _id: txn._id,
    transactionNumber: txn.transactionNumber || '-',
    transactionDate: txn.transactionDate, // Helper will format this
    accountName: txn.accountName || '-',
    phone: txn.phone || '-',
    email: txn.email || '-',
    netAmount: txn.netAmount || 0,
    status: txn.status || '-',
  }));

  await job.updateProgress(100);

  return {
    data: shapedTransactions,
    fileName: generateFileName(format, 'transaction-summary', parsedStartDate, parsedEndDate),
    recordCount: shapedTransactions.length,
    meta: {
      totalAmount,
      transactionType
    }
  };
}
