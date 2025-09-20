ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_mo_idempotency ON manufacturing_orders (idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS idempotency_key_confirm TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_mo_confirm_idempotency ON manufacturing_orders (idempotency_key_confirm) WHERE idempotency_key_confirm IS NOT NULL;
