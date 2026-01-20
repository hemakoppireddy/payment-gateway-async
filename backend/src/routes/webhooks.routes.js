import express from "express";
import { authenticateMerchant } from "../middleware/authMiddleware.js";
import {
  listWebhookLogs,
  resetWebhookForRetry
} from "../repositories/webhook.repo.js";
import { webhookQueue } from "../queue/webhook.queue.js";
import { apiError } from "../utils/errors.js";

const router = express.Router();

/**
 * GET /api/v1/webhooks
 */
router.get("/", authenticateMerchant, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);
    const offset = parseInt(req.query.offset || "0", 10);

    const result = await listWebhookLogs(
      req.merchant.id,
      limit,
      offset
    );

    res.status(200).json({
      data: result.data,
      total: result.total,
      limit,
      offset
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/webhooks/:webhook_id/retry
 */
router.post("/:webhook_id/retry", authenticateMerchant, async (req, res, next) => {
  try {
    const webhook = await resetWebhookForRetry(
      req.params.webhook_id,
      req.merchant.id
    );

    if (!webhook) {
      throw apiError(404, "NOT_FOUND_ERROR", "Webhook not found");
    }

    await webhookQueue.add({
      webhookLogId: webhook.id
    });

    res.status(200).json({
      id: webhook.id,
      status: webhook.status,
      message: "Webhook retry scheduled"
    });
  } catch (err) {
    next(err);
  }
});

export default router;
