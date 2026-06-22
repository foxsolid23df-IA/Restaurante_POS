-- Salon architecture MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.areas
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

ALTER TABLE public.tables
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS x_pos NUMERIC(10, 2) NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS y_pos NUMERIC(10, 2) NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS rotation INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

UPDATE public.areas
SET color = COALESCE(color, '#2563eb'),
    description = COALESCE(description, ''),
    updated_at = COALESCE(updated_at, timezone('utc'::TEXT, now()))
WHERE color IS NULL
   OR description IS NULL
   OR updated_at IS NULL;

UPDATE public.tables
SET shape = COALESCE(NULLIF(shape, ''), 'rounded'),
    x_pos = COALESCE(x_pos, 20),
    y_pos = COALESCE(y_pos, 20),
    rotation = COALESCE(rotation, 0),
    updated_at = COALESCE(updated_at, timezone('utc'::TEXT, now()))
WHERE shape IS NULL
   OR shape = ''
   OR x_pos IS NULL
   OR y_pos IS NULL
   OR rotation IS NULL
   OR updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_salon_areas_branch_active ON public.areas(branch_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_salon_tables_branch_status ON public.tables(branch_id, status, is_active);
CREATE INDEX IF NOT EXISTS idx_salon_tables_area ON public.tables(area_id);
CREATE INDEX IF NOT EXISTS idx_salon_orders_table_status ON public.orders(table_id, status);
CREATE INDEX IF NOT EXISTS idx_salon_reservations_table_date_status ON public.reservations(table_id, reservation_date, status);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_can_access_salon()
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
        p.role IN ('admin', 'manager', 'cashier', 'waiter', 'captain')
        OR COALESCE((p.permissions ->> 'access_pos')::BOOLEAN, FALSE)
        OR COALESCE((p.permissions ->> 'access_admin')::BOOLEAN, FALSE)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_salon_layout()
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
        OR COALESCE((p.permissions ->> 'access_admin')::BOOLEAN, FALSE)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_access_salon() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_salon_layout() TO authenticated;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['areas', 'tables']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Permitir todo a autenticados en %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to read %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to insert %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to update %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to delete %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Salon users can read %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Salon managers can write %I" ON public.%I', table_name, table_name);

    EXECUTE format(
      'CREATE POLICY "Salon users can read %I" ON public.%I FOR SELECT TO authenticated USING (public.user_can_access_salon())',
      table_name,
      table_name
    );

    EXECUTE format(
      'CREATE POLICY "Salon managers can write %I" ON public.%I FOR ALL TO authenticated USING (public.user_can_manage_salon_layout()) WITH CHECK (public.user_can_manage_salon_layout())',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_salon_layout(p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF p_branch_id IS NULL THEN
    RETURN jsonb_build_object('areas', '[]'::JSONB, 'tables', '[]'::JSONB, 'metrics', jsonb_build_object());
  END IF;

  SELECT jsonb_build_object(
    'areas', COALESCE((
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a.sort_order, a.name)
      FROM public.areas a
      WHERE a.branch_id = p_branch_id
        AND COALESCE(a.is_active, TRUE)
    ), '[]'::JSONB),
    'tables', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'branch_id', t.branch_id,
          'area_id', t.area_id,
          'name', t.name,
          'capacity', t.capacity,
          'status', t.status,
          'shape', t.shape,
          'x_pos', t.x_pos,
          'y_pos', t.y_pos,
          'rotation', t.rotation,
          'sort_order', t.sort_order,
          'is_active', t.is_active,
          'created_at', t.created_at,
          'updated_at', t.updated_at,
          'areas', CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id', a.id, 'name', a.name, 'color', a.color) END,
          'current_order', (
            SELECT jsonb_build_object(
              'id', o.id,
              'status', o.status,
              'created_at', o.created_at,
              'total_amount', o.total_amount,
              'user_id', o.user_id,
              'user_name', p.full_name
            )
            FROM public.orders o
            LEFT JOIN public.profiles p ON p.id = o.user_id
            WHERE o.table_id = t.id
              AND o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'active')
            ORDER BY o.created_at DESC
            LIMIT 1
          ),
          'next_reservation', (
            SELECT jsonb_build_object(
              'id', r.id,
              'reservation_date', r.reservation_date,
              'duration_minutes', r.duration_minutes,
              'pax', r.pax,
              'status', r.status,
              'customer_name', c.name
            )
            FROM public.reservations r
            LEFT JOIN public.customers c ON c.id = r.customer_id
            WHERE r.table_id = t.id
              AND r.status IN ('pending', 'confirmed')
              AND r.reservation_date >= timezone('utc'::TEXT, now())
            ORDER BY r.reservation_date ASC
            LIMIT 1
          )
        )
        ORDER BY t.sort_order, t.name
      )
      FROM public.tables t
      LEFT JOIN public.areas a ON a.id = t.area_id
      WHERE t.branch_id = p_branch_id
        AND COALESCE(t.is_active, TRUE)
    ), '[]'::JSONB),
    'metrics', COALESCE((
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'available', COUNT(*) FILTER (WHERE status = 'available'),
        'occupied', COUNT(*) FILTER (WHERE status = 'occupied'),
        'reserved', COUNT(*) FILTER (WHERE status = 'reserved'),
        'maintenance', COUNT(*) FILTER (WHERE status = 'maintenance'),
        'totalCapacity', COALESCE(SUM(capacity), 0),
        'occupiedCapacity', COALESCE(SUM(capacity) FILTER (WHERE status = 'occupied'), 0)
      )
      FROM public.tables
      WHERE branch_id = p_branch_id
        AND COALESCE(is_active, TRUE)
    ), jsonb_build_object())
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_area(p_area JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  area_record public.areas%ROWTYPE;
  area_id UUID := NULLIF(p_area->>'id', '')::UUID;
  branch_id UUID := NULLIF(p_area->>'branch_id', '')::UUID;
BEGIN
  IF NOT public.user_can_manage_salon_layout() THEN
    RAISE EXCEPTION 'permission denied for salon area';
  END IF;

  IF NULLIF(trim(COALESCE(p_area->>'name', '')), '') IS NULL THEN
    RAISE EXCEPTION 'area name is required';
  END IF;

  IF area_id IS NULL THEN
    IF branch_id IS NULL THEN
      RAISE EXCEPTION 'branch_id is required';
    END IF;

    INSERT INTO public.areas(branch_id, name, description, color, sort_order, is_active)
    VALUES (
      branch_id,
      trim(p_area->>'name'),
      NULLIF(trim(COALESCE(p_area->>'description', '')), ''),
      COALESCE(NULLIF(p_area->>'color', ''), '#2563eb'),
      COALESCE((p_area->>'sort_order')::INTEGER, 0),
      COALESCE((p_area->>'is_active')::BOOLEAN, TRUE)
    )
    RETURNING * INTO area_record;
  ELSE
    UPDATE public.areas
    SET name = trim(p_area->>'name'),
        description = NULLIF(trim(COALESCE(p_area->>'description', '')), ''),
        color = COALESCE(NULLIF(p_area->>'color', ''), color),
        sort_order = COALESCE((p_area->>'sort_order')::INTEGER, sort_order),
        is_active = COALESCE((p_area->>'is_active')::BOOLEAN, is_active),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = area_id
    RETURNING * INTO area_record;
  END IF;

  RETURN to_jsonb(area_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.save_table(p_table JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  table_record public.tables%ROWTYPE;
  table_id UUID := NULLIF(p_table->>'id', '')::UUID;
  branch_id UUID := NULLIF(p_table->>'branch_id', '')::UUID;
  area_id UUID := NULLIF(p_table->>'area_id', '')::UUID;
  table_status TEXT := COALESCE(NULLIF(p_table->>'status', ''), 'available');
BEGIN
  IF NOT public.user_can_manage_salon_layout() THEN
    RAISE EXCEPTION 'permission denied for salon table';
  END IF;

  IF table_status NOT IN ('available', 'occupied', 'reserved', 'maintenance') THEN
    RAISE EXCEPTION 'invalid table status';
  END IF;

  IF NULLIF(trim(COALESCE(p_table->>'name', '')), '') IS NULL THEN
    RAISE EXCEPTION 'table name is required';
  END IF;

  IF table_id IS NULL THEN
    IF branch_id IS NULL OR area_id IS NULL THEN
      RAISE EXCEPTION 'branch_id and area_id are required';
    END IF;

    INSERT INTO public.tables(branch_id, area_id, name, capacity, status, shape, x_pos, y_pos, rotation, sort_order, is_active)
    VALUES (
      branch_id,
      area_id,
      trim(p_table->>'name'),
      GREATEST(COALESCE((p_table->>'capacity')::INTEGER, 4), 1),
      table_status,
      COALESCE(NULLIF(p_table->>'shape', ''), 'rounded'),
      COALESCE((p_table->>'x_pos')::NUMERIC, 20),
      COALESCE((p_table->>'y_pos')::NUMERIC, 20),
      COALESCE((p_table->>'rotation')::INTEGER, 0),
      COALESCE((p_table->>'sort_order')::INTEGER, 0),
      COALESCE((p_table->>'is_active')::BOOLEAN, TRUE)
    )
    RETURNING * INTO table_record;
  ELSE
    UPDATE public.tables
    SET area_id = COALESCE(NULLIF(p_table->>'area_id', '')::UUID, tables.area_id),
        name = trim(p_table->>'name'),
        capacity = GREATEST(COALESCE((p_table->>'capacity')::INTEGER, tables.capacity), 1),
        status = table_status,
        shape = COALESCE(NULLIF(p_table->>'shape', ''), tables.shape),
        x_pos = COALESCE((p_table->>'x_pos')::NUMERIC, tables.x_pos),
        y_pos = COALESCE((p_table->>'y_pos')::NUMERIC, tables.y_pos),
        rotation = COALESCE((p_table->>'rotation')::INTEGER, tables.rotation),
        sort_order = COALESCE((p_table->>'sort_order')::INTEGER, tables.sort_order),
        is_active = COALESCE((p_table->>'is_active')::BOOLEAN, tables.is_active),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = table_id
    RETURNING * INTO table_record;
  END IF;

  RETURN to_jsonb(table_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_table_position(
  p_table_id UUID,
  p_x_pos NUMERIC,
  p_y_pos NUMERIC,
  p_rotation INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  table_record public.tables%ROWTYPE;
BEGIN
  IF NOT public.user_can_manage_salon_layout() THEN
    RAISE EXCEPTION 'permission denied for table position';
  END IF;

  UPDATE public.tables
  SET x_pos = LEAST(95, GREATEST(0, p_x_pos)),
      y_pos = LEAST(95, GREATEST(0, p_y_pos)),
      rotation = COALESCE(p_rotation, rotation),
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_table_id
  RETURNING * INTO table_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'table not found';
  END IF;

  RETURN to_jsonb(table_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_area(p_area_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  active_tables INTEGER;
BEGIN
  IF NOT public.user_can_manage_salon_layout() THEN
    RAISE EXCEPTION 'permission denied for area deactivation';
  END IF;

  SELECT COUNT(*) INTO active_tables
  FROM public.tables
  WHERE area_id = p_area_id
    AND COALESCE(is_active, TRUE);

  IF active_tables > 0 THEN
    RAISE EXCEPTION 'area has active tables; move or deactivate tables first';
  END IF;

  UPDATE public.areas
  SET is_active = FALSE,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_area_id;

  RETURN jsonb_build_object('areaId', p_area_id, 'isActive', FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_table(p_table_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  blocking_orders INTEGER;
  blocking_reservations INTEGER;
BEGIN
  IF NOT public.user_can_manage_salon_layout() THEN
    RAISE EXCEPTION 'permission denied for table deactivation';
  END IF;

  SELECT COUNT(*) INTO blocking_orders
  FROM public.orders
  WHERE table_id = p_table_id
    AND status IN ('pending', 'confirmed', 'preparing', 'ready', 'active');

  IF blocking_orders > 0 THEN
    RAISE EXCEPTION 'table has an active order';
  END IF;

  SELECT COUNT(*) INTO blocking_reservations
  FROM public.reservations
  WHERE table_id = p_table_id
    AND status IN ('pending', 'confirmed')
    AND reservation_date >= timezone('utc'::TEXT, now());

  IF blocking_reservations > 0 THEN
    RAISE EXCEPTION 'table has upcoming reservations';
  END IF;

  UPDATE public.tables
  SET is_active = FALSE,
      status = 'maintenance',
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_table_id;

  RETURN jsonb_build_object('tableId', p_table_id, 'isActive', FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_table_status(
  p_table_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  table_record public.tables%ROWTYPE;
BEGIN
  IF NOT public.user_can_access_salon() THEN
    RAISE EXCEPTION 'permission denied for table status';
  END IF;

  IF p_status NOT IN ('available', 'occupied', 'reserved', 'maintenance') THEN
    RAISE EXCEPTION 'invalid table status';
  END IF;

  UPDATE public.tables
  SET status = p_status,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_table_id
    AND COALESCE(is_active, TRUE)
  RETURNING * INTO table_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'table not found';
  END IF;

  RETURN to_jsonb(table_record);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_salon_layout(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_area(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_table(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_table_position(UUID, NUMERIC, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_area(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_table(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_table_status(UUID, TEXT) TO authenticated;
