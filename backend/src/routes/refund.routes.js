import express from "express";
import { authenticateMerchant } from "../middleware/authMiddleware.js";
import { pool } from "../config/db.js";
import { refundQueue } from "../queue/refund.queue.js";
import crypto from "crypto";

const router = express.Router();

function generateRefundId() {
  return "rfnd_" + crypto.randomBytes(8).toString("hex");
}

/**
 * Create refund
 */
router.post(
  "/payments/:payment_id/refunds",
  authenticateMerchant,
  async (req, res, next) => {
    try {
      const { payment_id } = req.params;
      const { amount, reason } = req.body;

      const { rows } = await pool.query(
        "SELECT * FROM payments WHERE id=$1",
        [payment_id]
      );

      const payment = rows[0];

      if (!payment || payment.merchant_id !== req.merchant.id) {
        return res.status(404).json({
          error: { code: "NOT_FOUND_ERROR", description: "Payment not found" }
        });
      }

      if (payment.status !== "success") {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Payment not refundable"
          }
        });
      }

      const { rows: refunded } = await pool.query(
        `
        SELECT COALESCE(SUM(amount),0) AS total
        FROM refunds
        WHERE payment_id=$1
        `,
        [payment_id]
      );

      if (amount > payment.amount - refunded[0].total) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Refund amount exceeds available amount"
          }
        });
      }

      const refundId = generateRefundId();

      const { rows: created } = await pool.query(
        `
        INSERT INTO refunds
        (id, payment_id, merchant_id, amount, reason)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [refundId, payment_id, req.merchant.id, amount, reason]
      );

      await refundQueue.add({ refundId });

      res.status(201).json(created[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get refund
 */
router.get(
  "/refunds/:refund_id",
  authenticateMerchant,
  async (req, res, next) => {
    try {
      const { refund_id } = req.params;

      const { rows } = await pool.query(
        "SELECT * FROM refunds WHERE id=$1",
        [refund_id]
      );

      const refund = rows[0];

      if (!refund || refund.merchant_id !== req.merchant.id) {
        return res.status(404).json({
          error: { code: "NOT_FOUND_ERROR", description: "Refund not found" }
        });
      }

      res.json(refund);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
