/**
 * =============================================================================
 * NIGHTLY RECALCULATION - MAIN ORCHESTRATOR
 * =============================================================================
 *
 * This is the main entry point for the nightly recalculation job.
 * It coordinates all refold operations and handles logging.
 *
 * EXECUTION FLOW:
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │                 NIGHTLY JOB LIFECYCLE                   │
 * ├─────────────────────────────────────────────────────────┤
 * │                                                         │
 * │  1. Job Triggered by Cron (11 PM daily)                 │
 * │     ↓                                                   │
 * │  2. runNightlyJob() starts                              │
 * │     ↓                                                   │
 * │  3. Phase 1: Item Ledger Refold                         │
 * │     └─> processAllDirtyItems()                          │
 * │         ├─> Find dirty items                            │
 * │         ├─> Process each item                           │
 * │         └─> Return statistics                           │
 * │     ↓                                                   │
 * │  4. Phase 2: Account Ledger Refold (TODO - Future)      │
 * │     └─> processAllDirtyAccounts()                       │
 * │     ↓                                                   │
 * │  5. Log Results & Send Alerts (if needed)               │
 * │     └─> Console logs                                    │
 * │     └─> Email/Slack notification (future)               │
 * │     ↓                                                   │
 * │  6. Job Completes                                       │
 * │                                                         │
 * └─────────────────────────────────────────────────────────┘
 *
 * Author: [Your Team]
 * Last Updated: Nov 2025
 * =============================================================================
 */

import { processAllDirtyAccounts } from "./accountLedgerRefold.js";
import { processAllDirtyItems } from "./itemLedgerRefold.js";


/**
 * Main nightly job function
 * Called by the cron scheduler every night at configured time
 *
 * @returns {Object} - Job execution results
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
    console.log('\n💰 PHASE 2: Account Ledger Recalculation');
    console.log('-'.repeat(70));
    const accountResults = await processAllDirtyAccounts();
    results.phases.accountLedger = accountResults;

    // =========================================================================
    // JOB COMPLETION
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    results.endTime = new Date();
    results.durationSeconds = parseFloat(duration);
    results.success = true;

    console.log("\n" + "=".repeat(70));
    console.log("✅ NIGHTLY RECALCULATION JOB COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`📦 Items Processed: ${itemResults.itemsProcessed}`);
    console.log(`📅 Months Refolded: ${itemResults.monthsRefolded}`);
    console.log(`❌ Errors: ${itemResults.errors.length}`);
    console.log("=".repeat(70) + "\n");

    // =========================================================================
    // ALERTS (Future Enhancement)
    // =========================================================================
    // If there were errors, send alert
    if (itemResults.errors.length > 0) {
      console.log("⚠️  ALERT: Job completed with errors. Review logs.");
      // TODO: Send email/Slack notification
      // await sendAlertNotification(results);
    }

    return results;
  } catch (error) {
    // =========================================================================
    // ERROR HANDLING
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
    console.error("❌ NIGHTLY RECALCULATION JOB FAILED");
    console.error("=".repeat(70));
    console.error(`⏱️  Duration Before Failure: ${duration} seconds`);
    console.error(`📝 Error Message: ${error.message}`);
    console.error("=".repeat(70));
    console.error("📋 Full Stack Trace:");
    console.error(error.stack);
    console.error("=".repeat(70) + "\n");

    // TODO: Send critical alert notification
    // await sendCriticalAlert(error);

    return results;
  }
};

/**
 * =============================================================================
 * FUTURE ENHANCEMENTS (Phase 2+)
 * =============================================================================
 */

/**
 * Send alert notification when job completes with errors
 * Can be email, Slack, SMS, etc.
 */
async function sendAlertNotification(results) {
  // TODO: Implement notification system
  // Example: Send email with error summary
  // Example: Post to Slack channel
  console.log("📧 Alert notification sent (not implemented yet)");
}

/**
 * Send critical alert when job completely fails
 */
async function sendCriticalAlert(error) {
  // TODO: Implement critical alert system
  console.log("🚨 Critical alert sent (not implemented yet)");
}
