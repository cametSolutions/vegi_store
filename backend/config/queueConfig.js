import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1', 
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Export queue name as constant
export const QUEUE_NAMES = {
  REPORT_EXPORTS: 'report-exports',
};

// Create and export the queue instance
export const reportExportsQueue = new Queue(QUEUE_NAMES.REPORT_EXPORTS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Wait 2s, then 4s, then 8s between retries
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep max 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours for debugging
    },
  },
});

// Export Redis connection for worker
export { redisConnection };
