import { pool } from "../config/db.js";

/**
 * Create a webhook log entry
 */
export async function createWebhookLog({
  merchantId,
  event,
  payload
}) {
  const { rows } = await pool.query(
    `
    INSERT INTO webhook_logs (
      merchant_id,
      event,
      payload
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [merchantId, event, payload]
  );

  return rows[0];
}

/**
 * Update webhook attempt result
 */
export async function updateWebhookAttempt({
  id,
  status,
  attempts,
  responseCode,
  responseBody,
  nextRetryAt
}) {
  await pool.query(
    `
    UPDATE webhook_logs
    SET
      status = $2,
      attempts = $3,
      response_code = $4,
      response_body = $5,
      last_attempt_at = NOW(),
      next_retry_at = $6
    WHERE id = $1
    `,
    [
      id,
      status,
      attempts,
      responseCode,
      responseBody,
      nextRetryAt
    ]
  );
}

/**
 * Get webhook logs for a merchant (dashboard)
 */
export async function listWebhookLogs({
  merchantId,
  limit,
  offset
}) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      event,
      status,
      attempts,
      created_at,
      last_attempt_at,
      response_code
    FROM webhook_logs
    WHERE merchant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [merchantId, limit, offset]
  );

  return rows;
}

/**
 * Get a webhook log by ID
 */
export async function findWebhookLogById(id) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM webhook_logs
    WHERE id = $1
    `,
    [id]
  );

  return rows[0] || null;
}

/**
 * Get pending webhooks ready for retry
 */
export async function getPendingWebhooks() {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM webhook_logs
    WHERE status = 'pending'
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY created_at ASC
    `
  );

  return rows;
}

export async function countWebhookLogs(merchantId) {
  const { rows } = await pool.query(
    `
    SELECT COUNT(*) 
    FROM webhook_logs
    WHERE merchant_id = $1
    `,
    [merchantId]
  );

  return parseInt(rows[0].count, 10);
}

export async function resetWebhookForRetry({
  webhookId,
  merchantId
}) {
  const { rows } = await pool.query(
    `
    UPDATE webhook_logs
    SET
      status = 'pending',
      attempts = 0,
      next_retry_at = NOW()
    WHERE id = $1
      AND merchant_id = $2
    RETURNING *
    `,
    [webhookId, merchantId]
  );

  return rows[0] || null;
}


