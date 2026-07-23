-- =============================================================
-- Phase 6 — Inteligencia y Analytics
-- =============================================================

-- 6.1 Business Rules Engine
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'discount',
  active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.2 Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  delivery_method TEXT NOT NULL DEFAULT 'email',
  time TIME NOT NULL DEFAULT '06:00',
  day_of_week INTEGER DEFAULT 1,
  day_of_month INTEGER DEFAULT 1,
  email TEXT,
  phone TEXT,
  params JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.3 Notification Queue (for scheduled report delivery + alerts)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  method TEXT NOT NULL DEFAULT 'email',
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- 6.4 Inventory alerts log
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name TEXT,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can manage business rules" ON business_rules
  FOR ALL TO authenticated USING (
    branch_id IS NULL OR EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.branch_id = business_rules.branch_id
    )
  );

CREATE POLICY "Staff can manage scheduled reports" ON scheduled_reports
  FOR ALL TO authenticated USING (
    branch_id IS NULL OR EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.branch_id = scheduled_reports.branch_id
    )
  );

CREATE POLICY "Staff can view notification queue" ON notification_queue
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert notifications" ON notification_queue
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can manage inventory alerts" ON inventory_alerts
  FOR ALL TO authenticated USING (
    branch_id IS NULL OR EXISTS (
      SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.branch_id = inventory_alerts.branch_id
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_rules_branch ON business_rules(branch_id, active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_branch ON inventory_alerts(branch_id, resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_severity ON inventory_alerts(severity) WHERE resolved = false;
