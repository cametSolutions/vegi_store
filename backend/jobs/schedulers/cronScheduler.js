import cron from "node-cron";
import { runNightlyJob } from "../tasks/nightly/nightlyRecalculation.js";
// import { testNightlyJob } from "../tasks/testJob.js";

export const initializeCronJobs = () => {  // Remove 'async'
  const schedule ="0 23 * * *";
    // process.env.NODE_ENV === "production"
    //   ? "0 23 * * *" // 11 PM every day
    //   : "*/1 * * * *"; // Every 2 minutes for testing

  const task = cron.schedule(
    schedule,
    async () => {
      console.log("⏰ Cron triggered - Starting nightly recalculation...");

      try {
        await runNightlyJob();
      } catch (error) {
        console.error("❌ Nightly job crashed:", error);
      }
    },
    {
      scheduled: false,
      timezone: "Asia/Kolkata",
    }
  );

  return task;
};



