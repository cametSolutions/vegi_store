// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "vegetable-billing-api",
      script: "./server.js",   // Main entry point of the API
      instances: "max",      // Scales API across all CPU cores
      exec_mode: "cluster",  // Enables load balancing for the API
      env: {
        NODE_ENV: "production",
        PORT: 5000 // Optional: Override default port if needed
      }
    },
    {
      name: "report-worker",
      script: "./worker.js",
      instances: 1,          // Keep 1 instance for workers to avoid duplicate job processing issues
      exec_mode: "fork",
      // Important for BullMQ: Give the worker time to finish the current job before killing it
      kill_timeout: 10000,   // Wait 10 seconds for graceful shutdown
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
