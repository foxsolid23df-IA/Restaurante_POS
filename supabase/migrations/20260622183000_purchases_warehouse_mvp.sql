-- Purchases and warehouse MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.supplier_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.supplier_categories
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_date DATE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

ALTER TABLE public.purchase_items
ADD COLUMN IF NOT EXISTS received_quantity NUMERIC(10, 4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.inventory_transfers
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE INDEX IF NOT EXISTS idx_supplier_categories_branch_active ON public.supplier_categories(branch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_status_branch ON public.purchases(branch_id, status, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_expected_date ON public.purchases(expected_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_received ON public.purchase_items(purchase_id, received_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_transfer ON public.inventory_transfer_items(transfer_id);

ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_categories TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'supplier_categories',
    'purchases',
    'purchase_items',
    'inventory_transfers',
    'inventory_transfer_items'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Warehouse users can read %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Warehouse managers can write %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Inventory managers can write %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users on %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated on %I" ON public.%I', table_name, table_name);

    EXECUTE format(
      'CREATE POLICY "Warehouse users can read %I" ON public.%I FOR SELECT TO authenticated USING (public.user_has_permission(''manage_inventory'') OR public.user_has_permission(''access_pos''))',
      table_name,
      table_name
    );

    EXECUTE format(
      'CREATE POLICY "Warehouse managers can write %I" ON public.%I FOR ALL TO authenticated USING (public.user_has_permission(''manage_inventory'')) WITH CHECK (public.user_has_permission(''manage_inventory''))',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_purchase_with_items(
  p_purchase JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  purchase_id UUID;
  line JSONB;
  purchase_status TEXT := COALESCE(NULLIF(p_purchase->>'status', ''), 'draft');
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for purchase creation';
  END IF;

  IF purchase_status NOT IN ('draft', 'ordered', 'partial', 'received', 'cancelled') THEN
    RAISE EXCEPTION 'invalid purchase status';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'purchase requires at least one item';
  END IF;

  INSERT INTO public.purchases (
    branch_id,
    supplier_id,
    user_id,
    invoice_number,
    total_amount,
    tax_amount,
    status,
    payment_method,
    payment_status,
    notes,
    purchase_date,
    expected_date,
    received_at,
    created_at
  )
  VALUES (
    NULLIF(p_purchase->>'branch_id', '')::UUID,
    NULLIF(p_purchase->>'supplier_id', '')::UUID,
    COALESCE(NULLIF(p_purchase->>'user_id', '')::UUID, auth.uid()),
    NULLIF(p_purchase->>'invoice_number', ''),
    COALESCE((p_purchase->>'total_amount')::NUMERIC, 0),
    COALESCE((p_purchase->>'tax_amount')::NUMERIC, 0),
    purchase_status,
    COALESCE(NULLIF(p_purchase->>'payment_method', ''), 'cash'),
    COALESCE(NULLIF(p_purchase->>'payment_status', ''), 'pending'),
    NULLIF(p_purchase->>'notes', ''),
    COALESCE((p_purchase->>'purchase_date')::TIMESTAMPTZ, timezone('utc'::TEXT, now())),
    NULLIF(p_purchase->>'expected_date', '')::DATE,
    CASE WHEN purchase_status = 'received' THEN timezone('utc'::TEXT, now()) ELSE NULL END,
    timezone('utc'::TEXT, now())
  )
  RETURNING id INTO purchase_id;

  FOR line IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE((line->>'quantity')::NUMERIC, 0) <= 0 THEN
      RAISE EXCEPTION 'purchase item quantity must be greater than zero';
    END IF;

    INSERT INTO public.purchase_items (
      purchase_id,
      inventory_item_id,
      quantity,
      unit_cost,
      total_cost,
      received_quantity,
      notes
    )
    VALUES (
      purchase_id,
      NULLIF(line->>'inventory_item_id', '')::UUID,
      COALESCE((line->>'quantity')::NUMERIC, 0),
      COALESCE((line->>'unit_cost')::NUMERIC, 0),
      COALESCE((line->>'total_cost')::NUMERIC, COALESCE((line->>'quantity')::NUMERIC, 0) * COALESCE((line->>'unit_cost')::NUMERIC, 0)),
      0,
      NULLIF(line->>'notes', '')
    );
  END LOOP;

  RETURN jsonb_build_object('purchaseId', purchase_id, 'status', purchase_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.receive_purchase_inventory(
  p_purchase_id UUID,
  p_items JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  purchase_record public.purchases%ROWTYPE;
  line RECORD;
  receive_line JSONB;
  receive_qty NUMERIC;
  remaining_qty NUMERIC;
  item_record public.inventory_items%ROWTYPE;
  old_stock NUMERIC;
  new_stock NUMERIC;
  current_value NUMERIC;
  received_value NUMERIC;
  weighted_cost NUMERIC;
  updated_count INTEGER := 0;
  all_received BOOLEAN := TRUE;
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

  IF purchase_record.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'purchase cannot be received in current status';
  END IF;

  FOR line IN
    SELECT *
    FROM public.purchase_items
    WHERE purchase_id = p_purchase_id
    FOR UPDATE
  LOOP
    remaining_qty := GREATEST(0, COALESCE(line.quantity, 0) - COALESCE(line.received_quantity, 0));

    IF p_items IS NULL THEN
      receive_qty := remaining_qty;
    ELSE
      SELECT value INTO receive_line
      FROM jsonb_array_elements(p_items)
      WHERE (value->>'purchase_item_id')::UUID = line.id
         OR (value->>'inventory_item_id')::UUID = line.inventory_item_id
      LIMIT 1;

      receive_qty := COALESCE((receive_line->>'quantity')::NUMERIC, 0);
    END IF;

    IF receive_qty < 0 OR receive_qty > remaining_qty THEN
      RAISE EXCEPTION 'invalid received quantity for purchase item %', line.id;
    END IF;

    IF receive_qty = 0 THEN
      IF remaining_qty > 0 THEN all_received := FALSE; END IF;
      CONTINUE;
    END IF;

    SELECT * INTO item_record
    FROM public.inventory_items
    WHERE id = line.inventory_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'inventory item not found';
    END IF;

    old_stock := COALESCE(item_record.current_stock, 0);
    new_stock := old_stock + receive_qty;
    current_value := old_stock * COALESCE(item_record.cost_per_unit, 0);
    received_value := receive_qty * COALESCE(line.unit_cost, 0);
    weighted_cost := CASE
      WHEN new_stock > 0 THEN (current_value + received_value) / new_stock
      ELSE COALESCE(line.unit_cost, item_record.cost_per_unit, 0)
    END;

    UPDATE public.inventory_items
    SET current_stock = new_stock,
        cost_per_unit = COALESCE(weighted_cost, cost_per_unit, 0),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = item_record.id;

    UPDATE public.purchase_items
    SET received_quantity = COALESCE(received_quantity, 0) + receive_qty
    WHERE id = line.id;

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
      'Recepcion compra #' || COALESCE(purchase_record.invoice_number, purchase_record.id::TEXT)
    );

    PERFORM public.upsert_inventory_alert(item_record.id);
    updated_count := updated_count + 1;

    IF receive_qty < remaining_qty THEN
      all_received := FALSE;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.purchase_items
    WHERE purchase_id = p_purchase_id
      AND COALESCE(received_quantity, 0) < COALESCE(quantity, 0)
  ) THEN
    all_received := FALSE;
  END IF;

  UPDATE public.purchases
  SET status = CASE WHEN all_received THEN 'received' ELSE 'partial' END,
      received_at = CASE WHEN all_received THEN COALESCE(received_at, timezone('utc'::TEXT, now())) ELSE received_at END,
      received_by = COALESCE(received_by, auth.uid()),
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'purchaseId', p_purchase_id,
    'itemsUpdated', updated_count,
    'status', CASE WHEN all_received THEN 'received' ELSE 'partial' END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_purchase(
  p_purchase_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  received_count INTEGER;
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for purchase cancellation';
  END IF;

  SELECT COUNT(*) INTO received_count
  FROM public.purchase_items
  WHERE purchase_id = p_purchase_id
    AND COALESCE(received_quantity, 0) > 0;

  IF received_count > 0 THEN
    RAISE EXCEPTION 'received purchases require an explicit stock reversal';
  END IF;

  UPDATE public.purchases
  SET status = 'cancelled',
      cancelled_at = timezone('utc'::TEXT, now()),
      cancellation_reason = COALESCE(NULLIF(p_reason, ''), 'Cancelacion de compra'),
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_purchase_id
    AND status <> 'cancelled';

  RETURN jsonb_build_object('purchaseId', p_purchase_id, 'status', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_inventory_transfer(
  p_from_branch_id UUID,
  p_to_branch_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  transfer_id UUID;
  line JSONB;
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for transfer creation';
  END IF;

  IF p_from_branch_id IS NULL OR p_to_branch_id IS NULL OR p_from_branch_id = p_to_branch_id THEN
    RAISE EXCEPTION 'invalid transfer branches';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'transfer requires at least one item';
  END IF;

  INSERT INTO public.inventory_transfers(from_branch_id, to_branch_id, requested_by, status, notes)
  VALUES (p_from_branch_id, p_to_branch_id, auth.uid(), 'pending', p_notes)
  RETURNING id INTO transfer_id;

  FOR line IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE((line->>'quantity')::NUMERIC, 0) <= 0 THEN
      RAISE EXCEPTION 'transfer item quantity must be greater than zero';
    END IF;

    INSERT INTO public.inventory_transfer_items(transfer_id, inventory_item_id, quantity)
    VALUES (transfer_id, NULLIF(line->>'inventory_item_id', '')::UUID, (line->>'quantity')::NUMERIC);
  END LOOP;

  RETURN jsonb_build_object('transferId', transfer_id, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_inventory_transfer(p_transfer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  transfer_record public.inventory_transfers%ROWTYPE;
  line RECORD;
  source_item public.inventory_items%ROWTYPE;
  dest_item public.inventory_items%ROWTYPE;
  old_source NUMERIC;
  new_source NUMERIC;
  old_dest NUMERIC;
  new_dest NUMERIC;
  completed_count INTEGER := 0;
BEGIN
  IF NOT public.user_has_permission('manage_inventory') THEN
    RAISE EXCEPTION 'permission denied for transfer completion';
  END IF;

  SELECT * INTO transfer_record
  FROM public.inventory_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer not found';
  END IF;

  IF transfer_record.status = 'completed' THEN
    RAISE EXCEPTION 'transfer already completed';
  END IF;

  FOR line IN
    SELECT *
    FROM public.inventory_transfer_items
    WHERE transfer_id = p_transfer_id
  LOOP
    SELECT * INTO source_item
    FROM public.inventory_items
    WHERE id = line.inventory_item_id
      AND branch_id = transfer_record.from_branch_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'source inventory item not found';
    END IF;

    old_source := COALESCE(source_item.current_stock, 0);
    IF old_source < line.quantity THEN
      RAISE EXCEPTION 'insufficient stock for transfer item %', source_item.name;
    END IF;
    new_source := old_source - line.quantity;

    UPDATE public.inventory_items
    SET current_stock = new_source,
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = source_item.id;

    SELECT * INTO dest_item
    FROM public.inventory_items
    WHERE branch_id = transfer_record.to_branch_id
      AND lower(name) = lower(source_item.name)
      AND unit = source_item.unit
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.inventory_items(name, unit, current_stock, min_stock, cost_per_unit, branch_id, is_active)
      VALUES (source_item.name, source_item.unit, 0, source_item.min_stock, source_item.cost_per_unit, transfer_record.to_branch_id, TRUE)
      RETURNING * INTO dest_item;
    END IF;

    old_dest := COALESCE(dest_item.current_stock, 0);
    new_dest := old_dest + line.quantity;

    UPDATE public.inventory_items
    SET current_stock = new_dest,
        cost_per_unit = COALESCE(NULLIF(cost_per_unit, 0), source_item.cost_per_unit, 0),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = dest_item.id;

    INSERT INTO public.inventory_log(inventory_item_id, branch_id, user_id, old_stock, new_stock, quantity_used, quantity_delta, movement_type, reference_type, reference_id, reason)
    VALUES
      (source_item.id, transfer_record.from_branch_id, auth.uid(), old_source, new_source, line.quantity, -line.quantity, 'transfer_out', 'transfer', transfer_record.id, 'Transferencia a sucursal'),
      (dest_item.id, transfer_record.to_branch_id, auth.uid(), old_dest, new_dest, -line.quantity, line.quantity, 'transfer_in', 'transfer', transfer_record.id, 'Transferencia desde sucursal');

    PERFORM public.upsert_inventory_alert(source_item.id);
    PERFORM public.upsert_inventory_alert(dest_item.id);
    completed_count := completed_count + 1;
  END LOOP;

  UPDATE public.inventory_transfers
  SET status = 'completed',
      completed_at = timezone('utc'::TEXT, now()),
      completed_by = auth.uid(),
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object('transferId', p_transfer_id, 'itemsTransferred', completed_count, 'status', 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_warehouse_dashboard(p_branch_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'purchasesMonth', COALESCE((
      SELECT COUNT(*)
      FROM public.purchases p
      WHERE p.purchase_date >= date_trunc('month', timezone('utc'::TEXT, now()))
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
    ), 0),
    'receivedToday', COALESCE((
      SELECT COUNT(*)
      FROM public.purchases p
      WHERE p.received_at >= date_trunc('day', timezone('utc'::TEXT, now()))
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
    ), 0),
    'pendingPurchases', COALESCE((
      SELECT COUNT(*)
      FROM public.purchases p
      WHERE p.status IN ('draft', 'ordered', 'partial')
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
    ), 0),
    'activeSuppliers', COALESCE((
      SELECT COUNT(*)
      FROM public.suppliers s
      WHERE COALESCE(s.is_active, TRUE)
        AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    ), 0),
    'criticalItems', COALESCE((
      SELECT COUNT(*)
      FROM public.inventory_items ii
      WHERE COALESCE(ii.is_active, TRUE)
        AND COALESCE(ii.current_stock, 0) <= COALESCE(ii.min_stock, 0)
        AND (p_branch_id IS NULL OR ii.branch_id = p_branch_id)
    ), 0),
    'openTransfers', COALESCE((
      SELECT COUNT(*)
      FROM public.inventory_transfers it
      WHERE it.status = 'pending'
        AND (p_branch_id IS NULL OR it.from_branch_id = p_branch_id OR it.to_branch_id = p_branch_id)
    ), 0)
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_purchase_suggestions(p_branch_id UUID DEFAULT NULL)
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
      'inventoryItemId', id,
      'name', name,
      'unit', unit,
      'currentStock', COALESCE(current_stock, 0),
      'minStock', COALESCE(min_stock, 0),
      'suggestedQuantity', GREATEST(COALESCE(min_stock, 0) * 2 - COALESCE(current_stock, 0), 0),
      'costPerUnit', COALESCE(cost_per_unit, 0),
      'estimatedCost', GREATEST(COALESCE(min_stock, 0) * 2 - COALESCE(current_stock, 0), 0) * COALESCE(cost_per_unit, 0),
      'priority', CASE WHEN COALESCE(current_stock, 0) <= COALESCE(min_stock, 0) * 0.5 THEN 'critical' ELSE 'low' END
    )
    ORDER BY (COALESCE(current_stock, 0) - COALESCE(min_stock, 0)) ASC
  ), '[]'::JSONB)
  INTO result
  FROM public.inventory_items
  WHERE COALESCE(is_active, TRUE)
    AND COALESCE(current_stock, 0) <= COALESCE(min_stock, 0)
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_purchase_with_items(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_purchase_inventory(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_purchase(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_inventory_transfer(UUID, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_inventory_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_warehouse_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_purchase_suggestions(UUID) TO authenticated;
