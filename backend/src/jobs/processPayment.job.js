import { updatePaymentStatus, findPaymentById } from "../repositories/payment.repo.js";
import { webhookQueue } from "../queue/webhook.queue.js";
import { pool } from "../config/db.js";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function processPaymentJob(job) {
  const { paymentId } = job.data;

  const payment = await findPaymentById(paymentId);
  if (!payment) {
    throw new Error(`Payment not found: ${paymentId}`);
  }

  const testMode = process.env.TEST_MODE === "true";

  const delay = testMode
    ? parseInt(process.env.TEST_PROCESSING_DELAY || "1000", 10)
    : Math.floor(Math.random() * 5000) + 5000;

  await sleep(delay);

  const success = testMode
    ? process.env.TEST_PAYMENT_SUCCESS !== "false"
    : Math.random() < (payment.method === "upi" ? 0.9 : 0.95);

  const event = success ? "payment.success" : "payment.failed";

  if (success) {
    await updatePaymentStatus(payment.id, "success", null, null);
  } else {
    await updatePaymentStatus(
      payment.id,
      "failed",
      "PAYMENT_FAILED",
      "Payment processing failed"
    );
  }

  /**
   * 🔔 STEP 6 REQUIRED:
   * Create webhook log BEFORE delivery
   */
  const { rows } = await pool.query(
    `
    INSERT INTO webhook_logs (
      merchant_id,
      event,
      payload,
      status,
      attempts
    )
    VALUES ($1, $2, $3, 'pending', 0)
    RETURNING id
    `,
    [
      payment.merchant_id,
      event,
      { payment }
    ]
  );

  const webhookLogId = rows[0].id;

  /**
   * 🔔 Enqueue webhook delivery with log ID
   */
  await webhookQueue.add({
    webhookLogId,
    merchantId: payment.merchant_id,
    event,
    payload: { payment }
  });

  return { success };
}
