import cron from "node-cron";
import { testNightlyJob } from "../tasks/testJob.js";

export const initializeCronJobs = () => {
  // Run every minute for testing (we'll change this later)
  // Cron syntax: * * * * * = minute hour day month weekday

  const task = cron.schedule(
    "* * * * *",
    async () => {
      console.log("⏰ Cron triggered!");
      await testNightlyJob();
    },
    {
      scheduled: false, // Don't start automatically
      timezone: "Asia/Kolkata",
    }
  );

  return task;
};
