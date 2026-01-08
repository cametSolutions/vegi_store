// worker.js
import dotenv from "dotenv";
import { Worker } from "bullmq";
import { redisConnection, QUEUE_NAMES } from "./config/queueConfig.js";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

// Import processors
import { processAccountReport } from "./workers/processors/accountReportProcessor.js";
import { processItemReport } from "./workers/processors/itemReportProcessor.js";
import { processTransactionReport } from "./workers/processors/transactionSummaryProcessor.js";
import { processOutstandingReport } from "./workers/processors/processOuststandingSummaryReport.js";
// import { processItemReport } from './workers/processors/itemReportProcessor.js';

dotenv.config();

// Main job router
async function processReportExport(job) {
  // console.log(" [Worker] Received job:", job);

  const { reportType } = job.data;

  console.log(`[Worker] Processing ${reportType} job ${job.id}`);

  try {
    // Route to appropriate processor based on reportType
    switch (reportType) {
      case "account-summary":
        return await processAccountReport(job);

      case "item-summary":
        return await processItemReport(job);

      case "transaction-summary":
        return await processTransactionReport(job);

      case "outstanding-summary":
        return await processOutstandingReport(job);

      // return await processItemReport(job);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  } catch (error) {
    console.error(`[Worker] Error processing job ${job.id}:`, error);
    throw error;
  }
}

async function startWorker() {
  try {
    await connectDB();
    console.log("✅ Worker: MongoDB connected");

    const worker = new Worker(QUEUE_NAMES.REPORT_EXPORTS, processReportExport, {
      connection: redisConnection,
      concurrency: 2,
    });

    worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    worker.on("active", (job) => {
      console.log(`⚙️  Job ${job.id} started processing`);
    });

    console.log("🚀 Worker started and listening for jobs...");

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, closing worker...");
      await worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received, closing worker...");
      await worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Worker startup failed:", error);
    process.exit(1);
  }
}

startWorker();
