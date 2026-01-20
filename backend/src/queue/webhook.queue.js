import Queue from "bull";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is not set");
}

export const webhookQueue = new Queue(
  "webhook-delivery-queue",
  redisUrl
);
