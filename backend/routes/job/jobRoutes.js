import express from "express";
import { testNightlyJob } from "../../jobs/tasks/testJob.js";
import { runNightlyJob } from "../../jobs/tasks/nightly/nightlyRecalculation.js";
const router = express.Router();


router.post("/trigger-nightly-job", async (req, res) => {
  try {
    console.log("🔧 Manual trigger started by admin");

    // Call the same job function
    await runNightlyJob();

    res.json({
      success: true,
      message: "Job completed successfully",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Job failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
