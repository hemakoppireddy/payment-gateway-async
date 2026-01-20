import { pool } from "../config/db.js";

export async function createPayment(payment) {
  const { rows } = await pool.query(
    `
    INSERT INTO payments (
      id, order_id, merchant_id, amount, currency,
      method, status, vpa, card_network, card_last4
    )
    VALUES ($1,$2,$3,$4,$5,$6,'processing',$7,$8,$9)
    RETURNING *
    `,
    [
      payment.id,
      payment.order_id,
      payment.merchant_id,
      payment.amount,
      payment.currency,
      payment.method,
      payment.vpa || null,
      payment.card_network || null,
      payment.card_last4 || null
    ]
  );

  return rows[0];
}

export async function updatePaymentStatus(
  id,
  status,
  errorCode,
  errorDescription
) {
  await pool.query(
    `
    UPDATE payments
    SET status = $2,
        error_code = $3,
        error_description = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    `,
    [id, status, errorCode, errorDescription]
  );
}

export async function findPaymentById(id) {
  const { rows } = await pool.query(
    "SELECT * FROM payments WHERE id = $1",
    [id]
  );
  return rows[0];
}
