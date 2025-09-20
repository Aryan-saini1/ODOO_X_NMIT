CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mo_id UUID NOT NULL,
  operation_name TEXT NOT NULL,
  work_center_id UUID,
  sequence INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  estimated_minutes NUMERIC,
  actual_minutes NUMERIC,
  assignee_id UUID,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX work_orders_mo_id_idx ON work_orders (mo_id);

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
