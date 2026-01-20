import express from "express";
import { authenticateMerchant } from "../middleware/authMiddleware.js";
import { createPaymentService } from "../services/payment.service.js";
import { findPaymentById } from "../repositories/payment.repo.js";
import { apiError } from "../utils/errors.js";
import { pool } from "../config/db.js";

const router = express.Router();

/**
 * Create payment (merchant API)
 */
router.post("/", authenticateMerchant, async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];

  try {
    // 🔁 IDEMPOTENCY CHECK
    if (idempotencyKey) {
      const cached = await pool.query(
        `
        SELECT response
        FROM idempotency_keys
        WHERE key = $1
          AND merchant_id = $2
          AND expires_at > NOW()
        `,
        [idempotencyKey, req.merchant.id]
      );

      if (cached.rows.length > 0) {
        return res.status(201).json(cached.rows[0].response);
      }
    }

    // 🔹 NORMAL PAYMENT CREATION
    const payment = await createPaymentService(req.body, req.merchant);

    // 💾 STORE IDEMPOTENT RESPONSE
    if (idempotencyKey) {
      await pool.query(
        `
        INSERT INTO idempotency_keys (
          key,
          merchant_id,
          response,
          expires_at
        )
        VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
        `,
        [idempotencyKey, req.merchant.id, payment]
      );
    }

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

/**
 * ✅ LIST ALL PAYMENTS FOR MERCHANT (REQUIRED FOR DASHBOARD)
 */
router.get("/", authenticateMerchant, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM payments
      WHERE merchant_id = $1
      ORDER BY created_at DESC
      `,
      [req.merchant.id]
    );

    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * Get single payment
 */
router.get("/:payment_id", authenticateMerchant, async (req, res, next) => {
  try {
    const payment = await findPaymentById(req.params.payment_id);

    if (!payment || payment.merchant_id !== req.merchant.id) {
      throw apiError(404, "NOT_FOUND_ERROR", "Payment not found");
    }

    res.status(200).json(payment);
  } catch (err) {
    next(err);
  }
});

/**
 * Capture payment
 */
router.post("/:payment_id/capture", authenticateMerchant, async (req, res, next) => {
  try {
    const { payment_id } = req.params;
    const { amount } = req.body;

    const { rows } = await pool.query(
      `
      SELECT *
      FROM payments
      WHERE id = $1
      `,
      [payment_id]
    );

    const payment = rows[0];

    if (!payment || payment.merchant_id !== req.merchant.id) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Payment not found"
        }
      });
    }

    if (payment.status !== "success" || payment.captured === true) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Payment not in capturable state"
        }
      });
    }

    if (amount && amount !== payment.amount) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Capture amount mismatch"
        }
      });
    }

    const { rows: updated } = await pool.query(
      `
      UPDATE payments
      SET captured = true,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [payment_id]
    );

    res.status(200).json(updated[0]);
  } catch (err) {
    next(err);
  }
});


export default router;
