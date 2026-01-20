module.exports = {
  apps: [
    // TEST API
    {
      name: "vegetable-billing-api-test",
      script: "./server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 10000
      }
    },
    // TEST WORKER
    {
      name: "report-worker-test",
      script: "./worker.js",
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 10000,
      env: {
        NODE_ENV: "production"
      }
    },

    // MAIN API
    {
      name: "vegetable-billing-api",
      script: "./server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 11000   // use a different port for main
      }
    },
    // MAIN WORKER
    {
      name: "report-worker",
      script: "./worker.js",
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 10000,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
