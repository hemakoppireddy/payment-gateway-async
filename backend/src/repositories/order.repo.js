import { pool } from "../config/db.js";

export async function createOrder(order) {
    const { rows } = await pool.query(
        `
    INSERT INTO orders
    (id, merchant_id, amount, currency, receipt, notes, status)
    VALUES ($1,$2,$3,$4,$5,$6,'created')
    RETURNING *
    `,
        [
            order.id,
            order.merchant_id,
            order.amount,
            order.currency,
            order.receipt,
            order.notes
        ]
    );

    return rows[0];
}

export async function findOrderById(orderId) {
    const { rows } = await pool.query(
        "SELECT * FROM orders WHERE id = $1",
        [orderId]
    );
    return rows[0];
}