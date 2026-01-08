// workers/processors/outstandingReportProcessor.js

import mongoose from 'mongoose';
import Outstanding from '../../model/OutstandingModel.js';
import { generateFileName, parseDateFilters, toObjectId } from '../utils/reportUtils.js';

/**
 * Background processor for Outstanding Statement Reports
 * Matches logic from getPartyOutstandingDetails controller
 */
export async function processOutstandingReport(job) {
  const { format, filters } = job.data;
  
  await job.updateProgress(10);

  // 1. Parse Dates
  const { parsedStartDate, parsedEndDate } = parseDateFilters(filters.startDate, filters.endDate);

  // 2. Build Match Conditions
  const matchConditions = {
    company: toObjectId(filters.company),
    branch: toObjectId(filters.branch),
    account: toObjectId(filters.account), // Note: Ensure frontend sends partyId
    status: { $nin: ['paid', 'cancelled', 'written_off'] }
  };

  // Outstanding Type Filter
  if (filters.outstandingType && ['dr', 'cr'].includes(filters.outstandingType)) {
    matchConditions.outstandingType = filters.outstandingType;
  }

  // Date Filter
  if (parsedStartDate && parsedEndDate) {
    matchConditions.transactionDate = {
      $gte: parsedStartDate,
      $lte: parsedEndDate
    };
  }

  await job.updateProgress(20);

  // 3. Fetch Transactions (Same aggregation as controller, but NO skip/limit)
  const customerOutstanding = await Outstanding.aggregate([
    { $match: matchConditions },
    {
      $lookup: {
        from: 'accountmasters',
        localField: 'account',
        foreignField: '_id',
        as: 'accountDetails'
      }
    },
    { $unwind: '$accountDetails' },
    {
      $addFields: {
        daysOverdue: {
          $cond: {
            if: { $and: [{ $ne: ['$dueDate', null] }, { $ne: ['$dueDate', undefined] }] },
            then: {
              $divide: [
                { $subtract: [new Date(), '$dueDate'] },
                1000 * 60 * 60 * 24
              ]
            },
            else: 0
          }
        }
      }
    },
    { $sort: { transactionDate: -1 } },
    // NO SKIP/LIMIT HERE - WE WANT ALL RECORDS FOR EXPORT
    {
      $project: {
        transactionId: '$_id',
        transactionNumber: 1,
        transactionDate: 1,
        transactionType: 1,
        dueDate: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        paidAmount: { $round: ['$paidAmount', 2] },
        closingBalanceAmount: { $round: ['$closingBalanceAmount', 2] },
        outstandingType: 1,
        daysOverdue: { $round: ['$daysOverdue', 0] },
        status: 1,
        notes: 1,
        customerName: '$accountDetails.accountName',
        customerEmail: '$accountDetails.email',
        customerPhone: '$accountDetails.phoneNo'
      }
    }
  ]);

  await job.updateProgress(60);

  // 4. Calculate Totals (Exact same aggregation as controller)
  const totalsAggregate = await Outstanding.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalOutstanding: { $sum: '$closingBalanceAmount' },
        totalDr: {
          $sum: {
            $cond: [
              { $eq: ['$outstandingType', 'dr'] },
              '$closingBalanceAmount',
              0
            ]
          }
        },
        totalCr: {
          $sum: {
            $cond: [
              { $eq: ['$outstandingType', 'cr'] },
              '$closingBalanceAmount',
              0
            ]
          }
        }
      }
    }
  ]);

  const totals = totalsAggregate[0] || {
    totalOutstanding: 0,
    totalDr: 0,
    totalCr: 0
  };

  await job.updateProgress(80);

  // 5. Final Formatting
  const resultTotals = {
    totalOutstanding: Math.round(totals.totalOutstanding * 100) / 100,
    totalDr: Math.round(totals.totalDr * 100) / 100,
    totalCr: Math.round(Math.abs(totals.totalCr) * 100) / 100,
  };
  
  // Calculate Net Outstanding (Sum of Dr + Cr) - matching controller logic
  const netOutstanding = Math.round((totals.totalDr + totals.totalCr) * 100) / 100;

  // Shape items exactly as needed by helper
  const shapedTransactions = customerOutstanding.map(txn => ({
    ...txn,
    // Add any specific formatting if needed, otherwise projection handled it
    transactionDate: txn.transactionDate, 
  }));

  await job.updateProgress(100);

  return {
    data: shapedTransactions,
    fileName: generateFileName(format, 'outstanding-statement', parsedStartDate, parsedEndDate),
    recordCount: shapedTransactions.length,
    // Metadata for the download helper (footer totals)
    totalOutstanding: resultTotals.totalOutstanding,
    totalDr: resultTotals.totalDr,
    totalCr: resultTotals.totalCr,
    netOutstanding: netOutstanding
  };
}
