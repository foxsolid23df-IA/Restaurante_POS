-- Add updated_at to products and loyalty_transactions for incremental sync consistency.
-- These tables were missing the column, which caused sync failures.

ALTER TABLE products ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE loyalty_transactions ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
