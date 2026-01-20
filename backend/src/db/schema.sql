CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* =========================
   MERCHANTS
   ========================= */
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  api_secret VARCHAR(64) NOT NULL,
  webhook_secret VARCHAR(64),
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   ORDERS
   ========================= */
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  amount INTEGER NOT NULL CHECK (amount >= 100),
  currency CHAR(3) DEFAULT 'INR',
  receipt VARCHAR(255),
  notes JSONB,
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   PAYMENTS (DELIVERABLE-2)
   ========================= */
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  amount INTEGER NOT NULL,
  currency CHAR(3) DEFAULT 'INR',
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  captured BOOLEAN DEFAULT false,
  vpa VARCHAR(255),
  card_network VARCHAR(20),
  card_last4 CHAR(4),
  error_code VARCHAR(50),
  error_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* =========================
   IDEMPOTENCY KEYS
   ========================= */
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255) NOT NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  PRIMARY KEY (key, merchant_id)
);

/* =========================
   WEBHOOK LOGS
   ========================= */
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL REFERENCES payments(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  amount INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment
  ON refunds(payment_id);

/* =========================
   INDEXES (REQUIRED)
   ========================= */
CREATE INDEX IF NOT EXISTS idx_orders_merchant
  ON orders(merchant_id);

CREATE INDEX IF NOT EXISTS idx_payments_order
  ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE INDEX IF NOT EXISTS idx_idempotency_merchant
  ON idempotency_keys(merchant_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant
  ON webhook_logs(merchant_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_status
  ON webhook_logs(status);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry
  ON webhook_logs(next_retry_at)
  WHERE status = 'pending';

/* =========================
   TEST MERCHANT WEBHOOK SECRET
   ========================= */
UPDATE merchants
SET webhook_secret = 'whsec_test_abc123'
WHERE email = 'test@example.com'
  AND webhook_secret IS NULL;
