import { pool } from "../config/db.js";

export async function getMerchantById(merchantId) {
  const { rows } = await pool.query(
    `
    SELECT id, webhook_url, webhook_secret
    FROM merchants
    WHERE id = $1
    `,
    [merchantId]
  );

  return rows[0] || null;
}
