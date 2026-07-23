-- =============================================================
-- Phase 7 — Multi-idioma App Staff
-- =============================================================

-- 7.1 Preferred language for staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'es';

-- 7.2 Preferred language for customers (for ticket printing)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es';

-- 7.3 Order language preference (set at order creation time for ticket printing)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_language TEXT DEFAULT 'es';
