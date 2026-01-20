import express from "express";
import { createPaymentService } from "../services/payment.service.js";
import { pool } from "../config/db.js";
import { apiError } from "../utils/errors.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { order_id } = req.body;

    const { rows } = await pool.query(
      `
      SELECT o.*, m.id AS merchant_id
      FROM orders o
      JOIN merchants m ON o.merchant_id = m.id
      WHERE o.id = $1
      `,
      [order_id]
    );

    if (rows.length === 0) {
      throw apiError(404, "NOT_FOUND_ERROR", "Order not found");
    }

    const merchant = { id: rows[0].merchant_id };

    const payment = await createPaymentService(req.body, merchant);
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

export default router;
