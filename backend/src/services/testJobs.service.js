import { testQueue } from "../queue/test.queue.js";

export const enqueueTestJob = async () => {
  await testQueue.add({ ping: true });
  return { message: "Test job enqueued" };
};

export const getJobStatus = async () => {
  const counts = await testQueue.getJobCounts();

  return {
    pending: counts.waiting ?? 0,
    processing: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    worker_status: "running"
  };
};
