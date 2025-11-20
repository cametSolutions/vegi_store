import cron from "node-cron";
import { runNightlyJob } from "../tasks/nightly/nightlyRecalculation.js";
// import { testNightlyJob } from "../tasks/testJob.js";

export const initializeCronJobs = async () => {
  // For testing: Run every 2 minutes
  // For production: '0 23 * * *' (11 PM daily)
  const schedule =
    process.env.NODE_ENV === "production"
      ? "0 23 * * *" // 11 PM every day
      : "*/2 * * * *"; // Every 2 minutes for testing

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

// export const initializeCronJobs = () => {
//   // Run every minute for testing (we'll change this later)
//   // Cron syntax: * * * * * = minute hour day month weekday

//   const task = cron.schedule(
//     "* * * * *",
//     async () => {
//       console.log("⏰ Cron triggered!");
//       await testNightlyJob();
//     },
//     {
//       scheduled: false, // Don't start automatically
//       timezone: "Asia/Kolkata",
//     }
//   );

//   return task;
// };
