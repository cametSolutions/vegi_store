// This will be your first "job"
export const testNightlyJob = async () => {
  console.log("🌙 Nightly job started at:", new Date().toLocaleString());

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 sec delay

  console.log("✅ Nightly job completed at:", new Date().toLocaleString());
};

