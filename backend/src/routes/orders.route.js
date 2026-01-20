import express from "express";
import { authenticateMerchant } from "../middleware/authMiddleware.js";
import { createOrderService } from "../services/order.service.js";
import { findOrderById } from "../repositories/order.repo.js";
import { apiError } from "../utils/errors.js";

const router = express.Router();

router.post("/", authenticateMerchant, async (req, res, next) => {
  try {
    const order = await createOrderService(req.body, req.merchant);
    res.status(201).json({
      ...order,
      created_at: order.created_at
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:order_id", authenticateMerchant, async (req, res, next) => {
  try {
    const order = await findOrderById(req.params.order_id);

    if (!order || order.merchant_id !== req.merchant.id) {
      throw apiError(404, "NOT_FOUND_ERROR", "Order not found");
    }

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

router.get("/:order_id/public", async (req, res, next) => {
  try {
    const order = await findOrderById(req.params.order_id);

    if (!order) {
      throw apiError(404, "NOT_FOUND_ERROR", "Order not found");
    }

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
  } catch (err) {
    next(err);
  }
});


export default router;
