import express from "express";
import { testQueue } from "../queue/test.queue.js";
import { paymentQueue } from "../queue/payment.queue.js";
import { webhookQueue } from "../queue/webhook.queue.js";

const router = express.Router();


router.get("/jobs/status", async (req, res, next) => {
  try {
    const [
      testCounts,
      paymentCounts,
      webhookCounts
    ] = await Promise.all([
      testQueue.getJobCounts(),
      paymentQueue.getJobCounts(),
      webhookQueue.getJobCounts()
    ]);

    res.status(200).json({
      pending:
        (testCounts.waiting || 0) +
        (paymentCounts.waiting || 0) +
        (webhookCounts.waiting || 0),

      processing:
        (testCounts.active || 0) +
        (paymentCounts.active || 0) +
        (webhookCounts.active || 0),

      completed:
        (testCounts.completed || 0) +
        (paymentCounts.completed || 0) +
        (webhookCounts.completed || 0),

      failed:
        (testCounts.failed || 0) +
        (paymentCounts.failed || 0) +
        (webhookCounts.failed || 0),

      worker_status: "running"
    });
  } catch (err) {
    next(err);
  }
});

export default router;
