import { pool } from "../config/db.js";
import { webhookQueue } from "../queue/webhook.queue.js";

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function processRefundJob(job) {
  const { refundId } = job.data;

  const { rows } = await pool.query(
    "SELECT * FROM refunds WHERE id=$1",
    [refundId]
  );

  const refund = rows[0];
  if (!refund) throw new Error("Refund not found");

  await sleep(Math.floor(Math.random() * 2000) + 3000);

  await pool.query(
    `
    UPDATE refunds
    SET status='processed',
        processed_at=NOW()
    WHERE id=$1
    `,
    [refundId]
  );

  await webhookQueue.add({
    merchantId: refund.merchant_id,
    event: "refund.processed",
    payload: { refund }
  });

  return { ok: true };
}
