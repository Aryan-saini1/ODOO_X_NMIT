CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE manufacturing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mo_number TEXT UNIQUE NOT NULL DEFAULT 'MO-' || substring(gen_random_uuid()::text, 1, 8),
  product_id UUID NOT NULL,
  quantity NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  bom_snapshot JSONB NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

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
