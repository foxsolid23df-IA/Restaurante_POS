-- Inventory MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE TABLE IF NOT EXISTS public.inventory_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_stock NUMERIC(10, 4) NOT NULL,
  new_stock NUMERIC(10, 4) NOT NULL,
  quantity_used NUMERIC(10, 4) NOT NULL,
  quantity_delta NUMERIC(10, 4),
  movement_type TEXT NOT NULL DEFAULT 'adjustment',
  reference_type TEXT,
  reference_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.inventory_log
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantity_delta NUMERIC(10, 4),
ADD COLUMN IF NOT EXISTS movement_type TEXT NOT NULL DEFAULT 'adjustment',
ADD COLUMN IF NOT EXISTS reference_type TEXT,
ADD COLUMN IF NOT EXISTS reference_id UUID;

UPDATE public.inventory_log
SET quantity_delta = COALESCE(quantity_delta, new_stock - old_stock)
WHERE quantity_delta IS NULL;

CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  current_stock NUMERIC(10, 4) NOT NULL,
  min_stock NUMERIC(10, 4) NOT NULL,
  unit TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.inventory_alerts
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_number TEXT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received',
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'received',
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  quantity NUMERIC(10, 4) NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL,
  total_cost NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  to_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transfer_id UUID REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  quantity NUMERIC(10, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_branch_active ON public.inventory_items(branch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON public.inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_log_item_created ON public.inventory_log(inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_log_branch_created ON public.inventory_log(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_branch_resolved ON public.inventory_alerts(branch_id, resolved, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_alerts_open_item ON public.inventory_alerts(inventory_item_id) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_active ON public.suppliers(branch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_branch_date ON public.purchases(branch_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_inventory_item ON public.purchase_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_from_status ON public.inventory_transfers(from_branch_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_to_status ON public.inventory_transfers(to_branch_id, status);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transfer_items TO authenticated;

CREATE OR REPLACE FUNCTION public.user_has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND COALESCE(p.is_active, TRUE)
      AND (
        p.role IN ('admin', 'manager')
        OR COALESCE((p.permissions ->> p_permission)::BOOLEAN, FALSE)
      )
  );
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'inventory_items',
    'inventory_log',
    'inventory_alerts',
    'suppliers',
    'purchases',
    'purchase_items',
    'inventory_transfers',
    'inventory_transfer_items'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users on %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated on %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Inventory managers can write %I" ON public.%I', table_name, table_name);

    EXECUTE format(
      'CREATE POLICY "Authenticated users can read %I" ON public.%I FOR SELECT TO authenticated USING (TRUE)',
      table_name,
      table_name
    );

    EXECUTE format(
      'CREATE POLICY "Inventory managers can write %I" ON public.%I FOR ALL TO authenticated USING (public.user_has_permission(''manage_inventory'')) WITH CHECK (public.user_has_permission(''manage_inventory''))',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_inventory_alert(p_inventory_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  item_record public.inventory_items%ROWTYPE;
  alert_severity TEXT;
BEGIN
  SELECT * INTO item_record
  FROM public.inventory_items
  WHERE id = p_inventory_item_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF COALESCE(item_record.current_stock, 0) > COALESCE(item_record.min_stock, 0) THEN
    UPDATE public.inventory_alerts
    SET resolved = TRUE,
        resolved_at = COALESCE(resolved_at, timezone('utc'::TEXT, now())),
        resolved_by = COALESCE(resolved_by, auth.uid())
    WHERE inventory_item_id = p_inventory_item_id
      AND resolved = FALSE;
    RETURN;
  END IF;

  alert_severity := CASE
    WHEN COALESCE(item_record.current_stock, 0) <= COALESCE(item_record.min_stock, 0) * 0.5 THEN 'critical'
    ELSE 'low'
  END;

  INSERT INTO public.inventory_alerts (
    inventory_item_id,
    branch_id,
    item_name,
    current_stock,
    min_stock,
    unit,
    severity
  )
  VALUES (
    item_record.id,
    item_record.branch_id,
    item_record.name,
    COALESCE(item_record.current_stock, 0),
    COALESCE(item_record.min_stock, 0),
    item_record.unit,
    alert_severity
  )
  ON CONFLICT (inventory_item_id) WHERE resolved = FALSE
  DO UPDATE SET
    current_stock = EXCLUDED.current_stock,
    min_stock = EXCLUDED.min_stock,
    unit = EXCLUDED.unit,
    severity = EXCLUDED.severity;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_inventory_item_id UUID,
  p_quantity_delta NUMERIC,
  p_reason TEXT,
  p_movement_type TEXT DEFAULT 'adjustment',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  item_record public.inventory_items%ROWTYPE;
  old_stock NUMERIC;
  new_stock NUMERIC;
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for inventory adjustment';
  END IF;

  SELECT * INTO item_record
  FROM public.inventory_items
  WHERE id = p_inventory_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inventory item not found';
  END IF;

  old_stock := COALESCE(item_record.current_stock, 0);
  new_stock := GREATEST(0, old_stock + COALESCE(p_quantity_delta, 0));

  UPDATE public.inventory_items
  SET current_stock = new_stock,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_inventory_item_id;

  INSERT INTO public.inventory_log (
    inventory_item_id,
    branch_id,
    user_id,
    old_stock,
    new_stock,
    quantity_used,
    quantity_delta,
    movement_type,
    reference_type,
    reference_id,
    reason
  )
  VALUES (
    p_inventory_item_id,
    item_record.branch_id,
    auth.uid(),
    old_stock,
    new_stock,
    old_stock - new_stock,
    new_stock - old_stock,
    COALESCE(p_movement_type, 'adjustment'),
    p_reference_type,
    p_reference_id,
    COALESCE(NULLIF(p_reason, ''), 'Ajuste de inventario')
  );

  PERFORM public.upsert_inventory_alert(p_inventory_item_id);

  RETURN jsonb_build_object(
    'inventoryItemId', p_inventory_item_id,
    'oldStock', old_stock,
    'newStock', new_stock,
    'quantityDelta', new_stock - old_stock
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.receive_purchase_inventory(p_purchase_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  purchase_record public.purchases%ROWTYPE;
  line RECORD;
  item_record public.inventory_items%ROWTYPE;
  old_stock NUMERIC;
  new_stock NUMERIC;
  current_value NUMERIC;
  received_value NUMERIC;
  weighted_cost NUMERIC;
  updated_count INTEGER := 0;
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for purchase receiving';
  END IF;

  SELECT * INTO purchase_record
  FROM public.purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'purchase not found';
  END IF;

  IF purchase_record.status = 'received' AND purchase_record.received_at IS NOT NULL THEN
    RAISE EXCEPTION 'purchase already received';
  END IF;

  FOR line IN
    SELECT *
    FROM public.purchase_items
    WHERE purchase_id = p_purchase_id
  LOOP
    SELECT * INTO item_record
    FROM public.inventory_items
    WHERE id = line.inventory_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    old_stock := COALESCE(item_record.current_stock, 0);
    new_stock := old_stock + COALESCE(line.quantity, 0);
    current_value := old_stock * COALESCE(item_record.cost_per_unit, 0);
    received_value := COALESCE(line.quantity, 0) * COALESCE(line.unit_cost, 0);
    weighted_cost := CASE
      WHEN new_stock > 0 THEN (current_value + received_value) / new_stock
      ELSE COALESCE(line.unit_cost, item_record.cost_per_unit, 0)
    END;

    UPDATE public.inventory_items
    SET current_stock = new_stock,
        cost_per_unit = COALESCE(weighted_cost, cost_per_unit, 0),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = item_record.id;

    INSERT INTO public.inventory_log (
      inventory_item_id,
      branch_id,
      user_id,
      old_stock,
      new_stock,
      quantity_used,
      quantity_delta,
      movement_type,
      reference_type,
      reference_id,
      reason
    )
    VALUES (
      item_record.id,
      COALESCE(item_record.branch_id, purchase_record.branch_id),
      auth.uid(),
      old_stock,
      new_stock,
      old_stock - new_stock,
      new_stock - old_stock,
      'purchase',
      'purchase',
      purchase_record.id,
      'Compra #' || COALESCE(purchase_record.invoice_number, purchase_record.id::TEXT)
    );

    PERFORM public.upsert_inventory_alert(item_record.id);
    updated_count := updated_count + 1;
  END LOOP;

  UPDATE public.purchases
  SET status = 'received',
      received_at = COALESCE(received_at, timezone('utc'::TEXT, now()))
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object('purchaseId', p_purchase_id, 'itemsUpdated', updated_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_order_inventory_deduction(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  line RECORD;
  item_record public.inventory_items%ROWTYPE;
  old_stock NUMERIC;
  new_stock NUMERIC;
  needed NUMERIC;
  updated_count INTEGER := 0;
BEGIN
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  FOR line IN
    SELECT
      oi.quantity AS ordered_quantity,
      pr.inventory_item_id,
      pr.quantity_required,
      COALESCE(pr.wastage_percentage, 0) AS wastage_percentage
    FROM public.order_items oi
    JOIN public.product_recipes pr ON pr.product_id = oi.product_id
    WHERE oi.order_id = p_order_id
  LOOP
    SELECT * INTO item_record
    FROM public.inventory_items
    WHERE id = line.inventory_item_id
      AND (branch_id IS NULL OR branch_id = order_record.branch_id)
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    old_stock := COALESCE(item_record.current_stock, 0);
    needed := COALESCE(line.quantity_required, 0) * (1 + COALESCE(line.wastage_percentage, 0) / 100) * COALESCE(line.ordered_quantity, 1);
    new_stock := GREATEST(0, old_stock - needed);

    UPDATE public.inventory_items
    SET current_stock = new_stock,
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = item_record.id;

    INSERT INTO public.inventory_log (
      inventory_item_id,
      branch_id,
      user_id,
      old_stock,
      new_stock,
      quantity_used,
      quantity_delta,
      movement_type,
      reference_type,
      reference_id,
      reason
    )
    VALUES (
      item_record.id,
      order_record.branch_id,
      order_record.user_id,
      old_stock,
      new_stock,
      old_stock - new_stock,
      new_stock - old_stock,
      'sale',
      'order',
      order_record.id,
      'Orden #' || order_record.id::TEXT
    );

    PERFORM public.upsert_inventory_alert(item_record.id);
    updated_count := updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object('orderId', p_order_id, 'itemsUpdated', updated_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_inventory_alert(p_alert_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for resolving inventory alert';
  END IF;

  UPDATE public.inventory_alerts
  SET resolved = TRUE,
      resolved_at = timezone('utc'::TEXT, now()),
      resolved_by = auth.uid()
  WHERE id = p_alert_id;

  RETURN jsonb_build_object('alertId', p_alert_id, 'resolved', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_inventory_dashboard(p_branch_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  WITH scoped_items AS (
    SELECT *
    FROM public.inventory_items
    WHERE COALESCE(is_active, TRUE)
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
  ),
  today_logs AS (
    SELECT *
    FROM public.inventory_log
    WHERE created_at >= date_trunc('day', timezone('utc'::TEXT, now()))
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
  )
  SELECT jsonb_build_object(
    'totalItems', COUNT(*),
    'criticalCount', COUNT(*) FILTER (WHERE COALESCE(current_stock, 0) <= COALESCE(min_stock, 0)),
    'missingCostCount', COUNT(*) FILTER (WHERE COALESCE(cost_per_unit, 0) <= 0),
    'inventoryValue', COALESCE(SUM(COALESCE(current_stock, 0) * COALESCE(cost_per_unit, 0)), 0),
    'entriesToday', COALESCE((SELECT SUM(quantity_delta) FROM today_logs WHERE quantity_delta > 0), 0),
    'exitsToday', ABS(COALESCE((SELECT SUM(quantity_delta) FROM today_logs WHERE quantity_delta < 0), 0)),
    'openAlerts', COALESCE((
      SELECT COUNT(*)
      FROM public.inventory_alerts ia
      WHERE ia.resolved = FALSE
        AND (p_branch_id IS NULL OR ia.branch_id = p_branch_id)
    ), 0)
  )
  INTO result
  FROM scoped_items;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_inventory_movements(
  p_inventory_item_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', il.id,
      'inventoryItemId', il.inventory_item_id,
      'itemName', ii.name,
      'unit', ii.unit,
      'oldStock', il.old_stock,
      'newStock', il.new_stock,
      'quantityDelta', COALESCE(il.quantity_delta, il.new_stock - il.old_stock),
      'movementType', il.movement_type,
      'referenceType', il.reference_type,
      'referenceId', il.reference_id,
      'reason', il.reason,
      'createdAt', il.created_at,
      'userName', p.full_name
    )
    ORDER BY il.created_at DESC
  ), '[]'::JSONB)
  INTO result
  FROM (
    SELECT *
    FROM public.inventory_log
    WHERE (p_inventory_item_id IS NULL OR inventory_item_id = p_inventory_item_id)
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
  ) il
  LEFT JOIN public.inventory_items ii ON ii.id = il.inventory_item_id
  LEFT JOIN public.profiles p ON p.id = il.user_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_inventory_alert(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_purchase_inventory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_order_inventory_deduction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_inventory_alert(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_movements(UUID, UUID, INTEGER) TO authenticated;
