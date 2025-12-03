import { runNightlyJob } from "../../jobs/tasks/nightly/nightlyRecalculation.js";

export const triggerRevaluation = async (req, res) => {
  try {
    const results = await runNightlyJob();

    if (!results.success) {
      return res.status(500).json({
        success: false,
        message: "Job failed",
        results,
      });
    }

    return res.json({
      success: true,
      message: "Job completed successfully",
      results,
    });
  } catch (error) {
    console.error("❌ Job failed (unhandled):", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
