// workers/utils/reportUtils.js
import mongoose from 'mongoose';

export const toObjectId = (id) => new mongoose.Types.ObjectId(id);

export function generateFileName(format, reportType, startDate, endDate) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const ext = format === 'excel' ? 'xlsx' : 'pdf';
  return `${reportType}-report-${dateStr}-${timeStr}.${ext}`;
}

export function parseDateFilters(startDate, endDate) {
  return {
    parsedStartDate: new Date(startDate),
    parsedEndDate: new Date(endDate)
  };
}

export function buildBaseMatch(filters, parsedStartDate, parsedEndDate) {
  const { company, branch, transactionType } = filters;
  
  const baseMatch = { 
    company, 
    branch,
    transactionDate: { $gte: parsedStartDate, $lte: parsedEndDate }
  };

  if (transactionType === 'sale') {
    baseMatch.transactionType = { $in: ['sale', 'purchasereturn'] };
  } else if (transactionType === 'purchase') {
    baseMatch.transactionType = { $in: ['purchase', 'salesreturn'] };
  }

  return baseMatch;
}
