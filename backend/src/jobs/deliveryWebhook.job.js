import crypto from "crypto";
import { pool } from "../config/db.js";
import { getMerchantById } from "../repositories/merchant.repo.js";
import { getRetryDelay } from "../utils/webhookRetrySchedule.js";

function sign(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export async function deliverWebhookJob(job) {
  const { webhookLogId, merchantId, event, payload } = job.data;

  const merchant = await getMerchantById(merchantId);
  if (!merchant || !merchant.webhook_url || !merchant.webhook_secret) {
    return { skipped: true };
  }

  const body = JSON.stringify({
    event,
    timestamp: Math.floor(Date.now() / 1000),
    data: payload
  });

  const signature = sign(body, merchant.webhook_secret);

  let response;
  let responseText = "";
  let status = "pending";

  try {
    response = await fetch(merchant.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature
      },
      body,
      signal: AbortSignal.timeout(5000)
    });

    responseText = await response.text();
    if (response.ok) status = "success";
  } catch (err) {
    responseText = err.message;
  }

  // Fetch current attempts
  const { rows } = await pool.query(
    "SELECT attempts FROM webhook_logs WHERE id = $1",
    [webhookLogId]
  );

  const attempts = (rows[0]?.attempts ?? 0) + 1;
  const isTestMode = process.env.WEBHOOK_RETRY_INTERVALS_TEST === "true";
  const delaySeconds = getRetryDelay(attempts, isTestMode);

  let nextRetryAt = null;
  let finalStatus = status;

  if (status !== "success") {
    if (delaySeconds === null) {
      finalStatus = "failed";
    } else {
      nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
    }
  }

  await pool.query(
    `
    UPDATE webhook_logs
    SET
      status = $1,
      attempts = $2,
      response_code = $3,
      response_body = $4,
      last_attempt_at = NOW(),
      next_retry_at = $5
    WHERE id = $6
    `,
    [
      finalStatus,
      attempts,
      response?.status ?? null,
      responseText,
      nextRetryAt,
      webhookLogId
    ]
  );

  return { status: finalStatus, attempts };
}
