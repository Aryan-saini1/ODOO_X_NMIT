CREATE SEQUENCE IF NOT EXISTS mo_number_seq START 1000;

-- Drop the default value for mo_number (we'll set it during INSERT instead)
ALTER TABLE manufacturing_orders ALTER COLUMN mo_number DROP DEFAULT;
