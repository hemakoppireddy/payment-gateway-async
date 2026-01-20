# Payment Gateway Platform – Async Processing, Webhooks & Hosted Checkout

## Project Description

This project is a **production-ready Payment Gateway platform** inspired by real-world systems such as **Razorpay** and **Stripe**.

It supports **asynchronous payment processing**, **webhook delivery with retries**, **refunds**, **idempotent APIs**, and a **hosted checkout + embeddable JavaScript SDK**.

The system is designed to demonstrate **real fintech backend architecture**, including background workers, Redis job queues, HMAC-secured webhooks, and fault-tolerant retry logic.

---

## Key Features

### Core Gateway

* Merchant authentication using **API Key & API Secret**
* Automatic **test merchant seeding**
* Secure **order creation & retrieval**
* Multi-method payments:

  * **UPI** (VPA validation)
  * **Card** (Luhn check, expiry validation, network detection)
* Payment lifecycle:

  * `pending → success / failed`
* **Capture support** for successful payments

### Async Processing (Deliverable-2)

* **Redis + Bull job queues**
* Dedicated **worker service**
* Non-blocking API responses
* Deterministic **TEST_MODE** for evaluation

### Webhooks

* Events:

  * `payment.success`
  * `payment.failed`
  * `refund.created`
  * `refund.processed`
* **HMAC-SHA256 signature verification**
* **Automatic retry with exponential backoff**
* Retry schedule:

  * Immediate → 1m → 5m → 30m → 2h
* Test retry mode:

  * `WEBHOOK_RETRY_INTERVALS_TEST=true`
* Webhook delivery logs with retry metadata

### Refunds

* Full & partial refunds
* Async refund processing
* Validation prevents over-refunds
* Refund lifecycle:

  * `pending → processed`

### Idempotency

* `Idempotency-Key` header support
* Prevents duplicate charges
* Cached responses valid for **24 hours**

### Frontend & SDK

* **Merchant Dashboard**

  * API credentials
  * Transactions
  * Webhook logs
* **Hosted Checkout Page**
* **Embeddable JavaScript SDK**

  * Modal + iframe
  * `postMessage` communication
  * Zero redirects

### DevOps

* Fully **Dockerized**
* One-command startup
* Health check endpoint
* Job queue status endpoint (required for evaluation)

---

## Quick Start

```bash
git clone <repo-url>
cd payment-gateway-async
docker-compose up -d --build
```

---

## Access URLs

| Service       | URL                                                                    |
| ------------- | ---------------------------------------------------------------------- |
| Backend API   | [http://localhost:8000](http://localhost:8000)                         |
| Dashboard     | [http://localhost:3000](http://localhost:3000)                         |
| Checkout Page | [http://localhost:3001/checkout](http://localhost:3001/checkout)       |
| SDK File      | [http://localhost:3001/checkout.js](http://localhost:3001/checkout.js) |
| Redis         | localhost:6379                                                         |
| Health        | [http://localhost:8000/health](http://localhost:8000/health)           |

---

## Demo Video

[Demo Link](https://drive.google.com/file/d/1qnAQA95StjVnTD4pBCNtRbydoR7L8rI5/view?usp=sharing)

---

## Test Merchant Credentials

Seeded automatically at startup:

```text
Email: test@example.com
API Key: key_test_abc123
API Secret: secret_test_xyz789
Webhook Secret: whsec_test_abc123
```

---

## Test Payment Details

### UPI

```text
user@paytm
test@phonepe
```

### Card (Visa)

```text
4111 1111 1111 1111
Expiry: 12/26
CVV: 123
Name: Test User
```

---

## Embeddable JavaScript SDK

### Include SDK

```html
<script src="http://localhost:3001/checkout.js"></script>
```

### Usage

```html
<script>
  const checkout = new PaymentGateway({
    key: "key_test_abc123",
    orderId: "order_xyz",
    onSuccess: (res) => console.log("Success:", res),
    onFailure: (err) => console.log("Failed:", err),
    onClose: () => console.log("Closed")
  });

  checkout.open();
</script>
```

### Behavior

* Opens modal
* Loads checkout page in iframe
* Communicates via `postMessage`
* No page redirects

---

## Async Payment Flow

1. Merchant creates payment → status `pending`
2. Payment ID enqueued to Redis
3. Worker processes payment asynchronously
4. Status updated to `success` / `failed`
5. Webhook delivery job enqueued
6. Webhook delivered with retries if needed

---

## Webhook Verification (Merchant Side)

```js
const crypto = require("crypto");

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return signature === expected;
}
```

---

## Job Queue Status (Required Endpoint)

```http
GET /api/v1/test/jobs/status
```

Example Response:

```json
{
  "pending": 3,
  "processing": 1,
  "completed": 42,
  "failed": 0,
  "worker_status": "running"
}
```

---

## Environment Configuration

`.env.example`

```env
DATABASE_URL=postgresql://gateway_user:gateway_pass@postgres:5432/payment_gateway
PORT=8000
REDIS_URL=redis://redis:6379

# Test merchant
TEST_MERCHANT_EMAIL=test@example.com
TEST_API_KEY=key_test_abc123
TEST_API_SECRET=secret_test_xyz789

# Payment simulation
TEST_MODE=false
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000

# Webhooks
WEBHOOK_RETRY_INTERVALS_TEST=true
```

---

## Project Structure

```text
backend/
  src/
    jobs/
    workers/
    repositories/
checkout-page/
  public/
    checkout.js
  src/
dashboard/
docker-compose.yml
submission.yml
README.md
```

---

## Health Check

```bash
curl http://localhost:8000/health
```

Response:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

---



