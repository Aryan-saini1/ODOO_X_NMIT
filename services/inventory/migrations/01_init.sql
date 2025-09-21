CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  location_id UUID NOT NULL,
  qty_available NUMERIC NOT NULL DEFAULT 0,
  qty_reserved NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(product_id, location_id)
);

CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  change_qty NUMERIC NOT NULL,
  type TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  idempotency_key TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  balance_after NUMERIC NOT NULL
);

CREATE UNIQUE INDEX stock_transactions_idempotency_key_idx 
ON stock_transactions (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

CREATE TABLE outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL, 
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX outbox_published_idx ON outbox (published) WHERE published = false;
