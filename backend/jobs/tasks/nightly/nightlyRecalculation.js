/**
 * =============================================================================
 * NIGHTLY RECALCULATION - MAIN ORCHESTRATOR
 * =============================================================================
 * Last Updated: Dec 2025
 */

import mongoose from "mongoose";
import { processAllDirtyAccounts } from "./accountLedgerRefold.js";
import { processAllDirtyItems } from "./itemLedgerRefold.js";
import AdjustmentEntryModel from "../../../model/AdjustmentEntryModel.js";
import { sendAdminAlert } from "../../../utils/emailAlert.js";
// 

/**
 * Main nightly job function
 * Called by the cron scheduler every night at configured time
 */
export const runNightlyJob = async () => {
  console.log("\n" + "=".repeat(70));
  console.log("🌙 NIGHTLY RECALCULATION JOB STARTED");
  console.log("=".repeat(70));
  console.log(
    `📅 Execution Time: ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`
  );
  console.log("=".repeat(70) + "\n");

  const startTime = Date.now();
  const results = {
    startTime: new Date(),
    phases: {},
  };

  try {
    // =========================================================================
    // PHASE 1: ITEM LEDGER RECALCULATION
    // =========================================================================
    console.log("📦 PHASE 1: Item Ledger Recalculation");
    console.log("-".repeat(70));

    const itemResults = await processAllDirtyItems();
    results.phases.itemLedger = itemResults;

    // =========================================================================
    // PHASE 2: ACCOUNT LEDGER RECALCULATION
    // =========================================================================
    console.log("\n💰 PHASE 2: Account Ledger Recalculation");
    console.log("-".repeat(70));
    const accountResults = await processAllDirtyAccounts();
    results.phases.accountLedger = accountResults;

    // =========================================================================
    // PHASE 3: MARK ALL PROCESSED ADJUSTMENTS AS REVERSED
    // =========================================================================
    const combinedProcessedAdjustmentIds = [
      ...(itemResults.processedAdjustmentIds || []),
      ...(accountResults.processedAdjustmentIds || []),
    ];
    const uniqueAdjustmentIds = [...new Set(combinedProcessedAdjustmentIds)];

    if (uniqueAdjustmentIds.length > 0) {
      console.log(
        "\n🔧 PHASE 3: Marking all processed adjustments as reversed"
      );
      console.log("-".repeat(70));

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const updateResult = await AdjustmentEntryModel.updateMany(
          { _id: { $in: uniqueAdjustmentIds } },
          {
            $set: {
              isReversed: true,
              reversedAt: new Date(),
              status: "reversed",
            },
          },
          { session }
        );

        await session.commitTransaction();
        console.log(
          `✅ Marked ${updateResult.modifiedCount} adjustments as reversed`
        );
        results.phases.adjustmentsReversed = updateResult.modifiedCount;
      } catch (error) {
        await session.abortTransaction();
        console.error("❌ Phase 3 failed:", error.message);
        // We don't throw here to allow the job to finish reporting stats
        results.phases.adjustmentsReversedError = error.message;
      } finally {
        session.endSession();
      }
    }

    // =========================================================================
    // JOB COMPLETION & REPORTING
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    results.endTime = new Date();
    results.durationSeconds = parseFloat(duration);
    results.success = true;

    console.log("\n" + "=".repeat(70));
    console.log("✅ NIGHTLY RECALCULATION JOB COMPLETED");
    console.log("=".repeat(70));
    console.log(`⏱️  Total Duration: ${duration} seconds`);

    // Check for partial errors (Job finished, but some items failed)
    const totalErrors =
      (itemResults.errors?.length || 0) + (accountResults.errors?.length || 0);

    if (totalErrors > 0) {
      console.log(`⚠️  ALERT: Job completed with ${totalErrors} errors.`);
      await sendAlertNotification(
        results,
        itemResults.errors,
        accountResults.errors
      );
    } else {
      console.log("✨ Clean Run: No errors detected.");
    }

    return results;
  } catch (error) {
    // =========================================================================
    // CRITICAL FAILURE HANDLING
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    results.endTime = new Date();
    results.durationSeconds = parseFloat(duration);
    results.success = false;
    results.error = {
      message: error.message,
      stack: error.stack,
    };

    console.error("\n" + "=".repeat(70));
    console.error("❌ NIGHTLY RECALCULATION JOB CRASHED");
    console.error("=".repeat(70));
    console.error(`⏱️  Duration Before Failure: ${duration} seconds`);
    console.error(error.stack);

    // Send Critical Alert immediately
    await sendCriticalAlert(error);

    return results;
  }
};

/**
 * =============================================================================
 * ALERT HELPERS
 * =============================================================================
 */

/**
 * Helper: Send alert when job completes but has data errors
 */
async function sendAlertNotification(
  results,
  itemErrors = [],
  accountErrors = []
) {
  const subject = `⚠️ Warning: Nightly Job Completed with Errors`;

  let errorHtml = `<h3>Job Summary</h3>
  <ul>
    <li><strong>Duration:</strong> ${results.durationSeconds}s</li>
    <li><strong>Item Errors:</strong> ${itemErrors.length}</li>
    <li><strong>Account Errors:</strong> ${accountErrors.length}</li>
  </ul>`;

  if (itemErrors.length > 0) {
    errorHtml += `<h4>Item Errors (First 5):</h4>
    <pre style="background:#eee; padding:10px;">${JSON.stringify(
      itemErrors.slice(0, 5),
      null,
      2
    )}</pre>`;
  }

  await sendAdminAlert(subject, errorHtml);
}

/**
 * Helper: Send critical alert when job crashes completely
 */
async function sendCriticalAlert(error) {
  const subject = `🚨 CRITICAL: Nightly Job Failed`;
  const html = `
    <h2 style="color:red;">Job Crashed</h2>
    <p>The nightly recalculation job threw an unhandled exception and stopped.</p>
    <p><strong>Error:</strong> ${error.message}</p>
    <h3>Stack Trace:</h3>
    <pre style="background:#f8d7da; padding:15px; border:1px solid #f5c6cb;">${error.stack}</pre>
  `;

  await sendAdminAlert(subject, html);
}
