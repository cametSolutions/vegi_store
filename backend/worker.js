import { Worker } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from './config/queueConfig.js';
import {
  refoldLedgersWithAdjustments,
  getSimpleLedgerReport,
  getHybridLedgerReport,
  checkIfDirtyPeriodExists
} from './services/accountLeger/accountLegerService.js';
import AccountLedger from './model/AccountLedgerModel.js';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import dotenv from "dotenv";

// ← ADD THIS LINE AT THE TOP, RIGHT AFTER IMPORTS
dotenv.config();
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Main job processor function
async function processReportExport(job) {
  const { reportType, format, filters } = job.data;

  console.log(`[Worker] Processing ${reportType} job ${job.id} (${format})`);
  
  try {
    // Update progress
    await job.updateProgress(10);

    // Parse filters
    const { startDate, endDate, company, branch, account, transactionType, searchTerm } = filters;
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    const singleAccount = account ? toObjectId(account) : null;

    await job.updateProgress(20);

    // Get account IDs for dirty check (same logic as your controller)
    const baseMatch = { 
      company, 
      branch,
      transactionDate: { $gte: parsedStartDate, $lte: parsedEndDate }
    };

    if (singleAccount) {
      baseMatch.account = singleAccount;
    }
    if (transactionType === 'sale') baseMatch.transactionType = { $in: ['sale', 'purchasereturn'] };
    else if (transactionType === 'purchase') baseMatch.transactionType = { $in: ['purchase', 'salesreturn'] };

    const accountIdsForCheck = await AccountLedger.distinct('account', baseMatch);

    if (accountIdsForCheck.length === 0) {
      return {
        data: [],
        fileName: generateFileName(format, parsedStartDate, parsedEndDate),
        recordCount: 0,
      };
    }

    await job.updateProgress(30);

    // Check dirty period status
    const dirtyStatus = await checkIfDirtyPeriodExists(
      company, 
      branch, 
      accountIdsForCheck.map(id => id.toString()),
      parsedStartDate, 
      parsedEndDate
    );

    await job.updateProgress(40);

    // Route to appropriate service PATH (NO PAGINATION, summaryOnly=false)
    let serviceResult;
    const page = 1;
    const limit = 999999; // Effectively no limit
    const summaryOnly = false;

    if (!dirtyStatus.isDirty) {
      console.log('[Worker] Using FAST PATH');
      serviceResult = await getSimpleLedgerReport(
        company, branch, parsedStartDate, parsedEndDate,
        transactionType || null, page, limit, searchTerm?.trim() || null,
        singleAccount, summaryOnly
      );
    } 
    else if (dirtyStatus.isDirty && !dirtyStatus.needsFullRefold) {
      console.log('[Worker] Using HYBRID PATH');
      serviceResult = await getHybridLedgerReport(
        company, branch, parsedStartDate, parsedEndDate,
        transactionType || null, page, limit, searchTerm?.trim() || null,
        singleAccount, summaryOnly
      );
    } 
    else {
      console.log('[Worker] Using FULL REFOLD');
      serviceResult = await refoldLedgersWithAdjustments(
        company, branch, parsedStartDate, parsedEndDate,
        transactionType || null, page, limit, searchTerm?.trim() || null,
        singleAccount, summaryOnly
      );
    }

    await job.updateProgress(80);

    // Shape the data for frontend
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

    console.log(`[Worker] Completed job ${job.id} - ${shapedItems.length} accounts`);

    // Return data to frontend (no file generation here)
    return {
      data: shapedItems,
      fileName: generateFileName(format, parsedStartDate, parsedEndDate),
      recordCount: shapedItems.length,
    };

  } catch (error) {
    console.error(`[Worker] Error processing job ${job.id}:`, error);
    throw error; // BullMQ will handle retry
  }
}

// Helper function to generate filename
function generateFileName(format, startDate, endDate) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const ext = format === 'excel' ? 'xlsx' : 'pdf';
  return `account-summary-${dateStr}-${timeStr}.${ext}`;
}

// ← START WORKER ONLY AFTER DB CONNECTION
async function startWorker() {
  try {
    // Wait for DB connection
    await connectDB();
    console.log('✅ Worker: MongoDB connected');

    // Now create worker
    const worker = new Worker(QUEUE_NAMES.REPORT_EXPORTS, processReportExport, {
      connection: redisConnection,
      concurrency: 2,
    });

    // Event listeners for monitoring
    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    worker.on('active', (job) => {
      console.log(`⚙️  Job ${job.id} started processing`);
    });

    console.log('🚀 Worker started and listening for jobs...');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing worker...');
      await worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing worker...');
      await worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Worker startup failed:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
