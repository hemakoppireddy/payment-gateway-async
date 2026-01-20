import { testQueue } from "./src/queue/test.queue.js";
import { paymentQueue } from "./src/queue/payment.queue.js";
import { webhookQueue } from "./src/queue/webhook.queue.js";

import { processPaymentJob } from "./src/jobs/processPayment.job.js";
import { deliverWebhookJob } from "./src/jobs/deliveryWebhook.job.js";
import { pool } from "./src/config/db.js";
import { refundQueue } from "./src/queue/refund.queue.js";
import { processRefundJob } from "./src/jobs/processRefund.job.js";

console.log("🔧 Worker starting...");

/**
 * 🔹 Test queue
 */
testQueue.process(async (job) => {
  console.log("🧪 Processing test job:", job.id);
  return { ok: true };
});

/**
 * 🔹 Payment queue
 */
paymentQueue.process(async (job) => {
  console.log("💳 Processing payment job:", job.data.paymentId);
  return processPaymentJob(job);
});

/**
 * 🔹 Webhook delivery queue
 */
webhookQueue.process(async (job) => {
  console.log("📡 Delivering webhook:", job.data.event);
  return deliverWebhookJob(job);
});

refundQueue.process(async (job) => {
  console.log("↩️ Processing refund:", job.data.refundId);
  return processRefundJob(job);
});

console.log("✅ Worker connected to all queues");

/**
 * 🔁 Webhook retry poller (STEP 6.7)
 * Picks pending webhooks whose next_retry_at <= now()
 */
setInterval(async () => {
  try {
    const { rows } = await pool.query(
      `
      SELECT id, merchant_id, event, payload
      FROM webhook_logs
      WHERE status = 'pending'
        AND next_retry_at IS NOT NULL
        AND next_retry_at <= NOW()
      LIMIT 10
      `
    );

    for (const row of rows) {
      await webhookQueue.add({
        webhookLogId: row.id,
        merchantId: row.merchant_id,
        event: row.event,
        payload: row.payload
      });
    }
  } catch (err) {
    console.error("Webhook retry poller error:", err.message);
  }
}, 5000);
