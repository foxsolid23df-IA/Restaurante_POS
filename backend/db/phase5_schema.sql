-- =============================================================
-- Phase 5 — Integraciones y Hardware
-- =============================================================

-- 5.1 Webhook Logs (for all gateways)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- 5.2 Payment gateway configuration
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS payment_gateway_config JSONB;

-- 5.3 Orders: payment metadata columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_updated_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_expected NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_received NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_due NUMERIC(12,2);

-- 5.4 CFDI / Invoice history
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  xml TEXT NOT NULL,
  uuid UUID,
  serie TEXT,
  folio INTEGER,
  subtotal NUMERIC(12,2),
  total NUMERIC(12,2),
  currency TEXT DEFAULT 'MXN',
  receiver_rfc TEXT,
  emitter_rfc TEXT,
  status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stamped_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 5.5 Fiscal printer config (branch-level)
CREATE TABLE IF NOT EXISTS fiscal_printer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  printer_type TEXT NOT NULL DEFAULT 'none',
  connection TEXT,
  host TEXT,
  port INTEGER,
  com_port TEXT,
  vendor_id INTEGER,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id)
);

-- 5.6 RPC functions for payment gateway operations
CREATE OR REPLACE FUNCTION create_paypal_order(
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'MXN',
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder: actual integration calls PayPal API
  RETURN jsonb_build_object(
    'id', gen_random_uuid()::TEXT,
    'status', 'CREATED',
    'amount', p_amount,
    'currency', p_currency,
    'metadata', p_metadata
  );
END;
$$;

CREATE OR REPLACE FUNCTION capture_paypal_order(
  p_order_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', p_order_id,
    'status', 'COMPLETED',
    'capture_id', gen_random_uuid()::TEXT
  );
END;
$$;

CREATE OR REPLACE FUNCTION refund_paypal_payment(
  p_capture_id TEXT,
  p_amount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'capture_id', p_capture_id,
    'status', 'COMPLETED',
    'amount', p_amount
  );
END;
$$;

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_printer_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can view webhook logs" ON webhook_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  );

CREATE POLICY "Staff can insert webhook logs" ON webhook_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can view invoices" ON invoices
  FOR SELECT TO authenticated USING (
    branch_id IS NULL OR EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.branch_id = invoices.branch_id
    )
  );

CREATE POLICY "Staff can insert invoices" ON invoices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can manage fiscal printer config" ON fiscal_printer_config
  FOR ALL TO authenticated USING (
    branch_id IS NULL OR EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.branch_id = fiscal_printer_config.branch_id
    )
  );
