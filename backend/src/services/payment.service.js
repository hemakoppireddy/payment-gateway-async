import { apiError } from "../utils/errors.js";
import { isValidVPA } from "../utils/vpaValidator.js";
import { isValidCardNumber } from "../utils/luhn.js";
import { detectCardNetwork } from "../utils/cardNetwork.js";
import { isValidExpiry } from "../utils/expiryValidator.js";
import { generatePaymentId } from "../utils/paymentIdGenerator.js";
import { createPayment } from "../repositories/payment.repo.js";
import { findOrderById } from "../repositories/order.repo.js";
import { paymentQueue } from "../queue/payment.queue.js";

export async function createPaymentService(body, merchant) {
  const { order_id, method } = body;

  /* 🔹 Validate order */
  const order = await findOrderById(order_id);
  if (!order || order.merchant_id !== merchant.id) {
    throw apiError(404, "NOT_FOUND_ERROR", "Order not found");
  }

  let paymentData = {
    id: generatePaymentId(),
    order_id: order.id,
    merchant_id: merchant.id,
    amount: order.amount,
    currency: order.currency,
    method,
    status: "pending" // 🔹 CHANGED: async flow starts here
  };

  /* 🔹 UPI PAYMENT */
  if (method === "upi") {
    if (!isValidVPA(body.vpa)) {
      throw apiError(400, "INVALID_VPA", "VPA format invalid");
    }
    paymentData.vpa = body.vpa;
  }

  /* 🔹 CARD PAYMENT */
  else if (method === "card") {
    const { number, expiry_month, expiry_year } = body.card || {};

    if (!number || !expiry_month || !expiry_year) {
      throw apiError(400, "INVALID_CARD", "Card validation failed");
    }

    const cleanedNumber = number.replace(/\D/g, "");

    if (!isValidCardNumber(cleanedNumber)) {
      throw apiError(400, "INVALID_CARD", "Card validation failed");
    }

    if (!isValidExpiry(expiry_month, expiry_year)) {
      throw apiError(400, "EXPIRED_CARD", "Card expiry date invalid");
    }

    paymentData.card_network = detectCardNetwork(cleanedNumber);
    paymentData.card_last4 = cleanedNumber.slice(-4);
  }

  /* 🔹 INVALID METHOD */
  else {
    throw apiError(400, "BAD_REQUEST_ERROR", "Invalid payment method");
  }

  /* 🔹 Create payment (NO processing here) */
  const payment = await createPayment(paymentData);

  /* 🔹 Enqueue async processing job */
  await paymentQueue.add({
    paymentId: payment.id
  });

  return {
  ...payment,
  status: "pending"
};

}
