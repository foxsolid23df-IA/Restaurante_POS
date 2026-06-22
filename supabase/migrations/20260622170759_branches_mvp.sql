-- Branches MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  opening_hours JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_main_office BOOLEAN NOT NULL DEFAULT FALSE,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
ADD COLUMN IF NOT EXISTS opening_hours JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_main_office BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

UPDATE public.branches
SET code = upper(left(regexp_replace(COALESCE(name, id::TEXT), '[^a-zA-Z0-9]', '', 'g'), 8))
WHERE code IS NULL
  AND name IS NOT NULL;

UPDATE public.branches
SET timezone = 'America/Mexico_City'
WHERE timezone IS NULL OR timezone = '';

UPDATE public.branches
SET opening_hours = '{}'::JSONB
WHERE opening_hours IS NULL OR jsonb_typeof(opening_hours) <> 'object';

CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_code
ON public.branches(lower(code))
WHERE code IS NOT NULL AND code <> '';

DO $$
DECLARE
  branch_table TEXT;
BEGIN
  FOREACH branch_table IN ARRAY ARRAY[
    'profiles',
    'areas',
    'tables',
    'printers',
    'orders',
    'inventory_items',
    'suppliers',
    'purchases',
    'customers',
    'reservations',
    'menus'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = branch_table
        AND column_name = 'branch_id'
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I(branch_id)',
        'idx_branches_' || branch_table || '_branch_id',
        branch_table
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.branches TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_can_manage_branches()
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
        p.role = 'admin'
        OR COALESCE((p.permissions ->> 'access_admin')::BOOLEAN, FALSE)
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_manage_branches() TO authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable all for authenticated on branches" ON public.branches;
  DROP POLICY IF EXISTS "Allow authenticated users to read branches" ON public.branches;
  DROP POLICY IF EXISTS "Allow authenticated users to insert branches" ON public.branches;
  DROP POLICY IF EXISTS "Allow authenticated users to update branches" ON public.branches;
  DROP POLICY IF EXISTS "Allow authenticated users to delete branches" ON public.branches;
  DROP POLICY IF EXISTS "Branch users can read branches" ON public.branches;
  DROP POLICY IF EXISTS "Branch admins can insert branches" ON public.branches;
  DROP POLICY IF EXISTS "Branch admins can update branches" ON public.branches;
END $$;

CREATE POLICY "Branch users can read branches"
ON public.branches
FOR SELECT
TO authenticated
USING (
  is_active = TRUE
  OR public.user_can_manage_branches()
);

CREATE POLICY "Branch admins can insert branches"
ON public.branches
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_manage_branches());

CREATE POLICY "Branch admins can update branches"
ON public.branches
FOR UPDATE
TO authenticated
USING (public.user_can_manage_branches())
WITH CHECK (public.user_can_manage_branches());

CREATE OR REPLACE FUNCTION public.get_branches_dashboard()
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
      'id', b.id,
      'name', b.name,
      'code', b.code,
      'address', b.address,
      'phone', b.phone,
      'email', b.email,
      'timezone', b.timezone,
      'openingHours', b.opening_hours,
      'isActive', b.is_active,
      'isMainOffice', b.is_main_office,
      'createdAt', b.created_at,
      'updatedAt', b.updated_at,
      'salesToday', COALESCE((
        SELECT SUM(pay.amount)
        FROM public.payments pay
        JOIN public.orders o ON o.id = pay.order_id
        WHERE o.branch_id = b.id
          AND pay.created_at >= date_trunc('day', timezone('utc'::TEXT, now()))
      ), 0),
      'openOrders', COALESCE((
        SELECT COUNT(*)
        FROM public.orders o
        WHERE o.branch_id = b.id
          AND COALESCE(o.status, '') NOT IN ('completed', 'cancelled', 'paid')
      ), 0),
      'activeStaff', COALESCE((
        SELECT COUNT(*)
        FROM public.profiles p
        WHERE p.branch_id = b.id
          AND COALESCE(p.is_active, TRUE)
      ), 0),
      'occupiedTables', COALESCE((
        SELECT COUNT(*)
        FROM public.tables t
        WHERE t.branch_id = b.id
          AND t.status = 'occupied'
      ), 0),
      'totalTables', COALESCE((
        SELECT COUNT(*)
        FROM public.tables t
        WHERE t.branch_id = b.id
      ), 0),
      'criticalStock', COALESCE((
        SELECT COUNT(*)
        FROM public.inventory_items ii
        WHERE ii.branch_id = b.id
          AND COALESCE(ii.is_active, TRUE)
          AND COALESCE(ii.current_stock, 0) <= COALESCE(ii.min_stock, 0)
      ), 0),
      'pendingPurchases', COALESCE((
        SELECT COUNT(*)
        FROM public.purchases p
        WHERE p.branch_id = b.id
          AND p.status IN ('draft', 'ordered', 'partial')
      ), 0),
      'openTransfers', COALESCE((
        SELECT COUNT(*)
        FROM public.inventory_transfers it
        WHERE it.status = 'pending'
          AND (it.from_branch_id = b.id OR it.to_branch_id = b.id)
      ), 0)
    )
    ORDER BY b.is_active DESC, b.is_main_office DESC, b.name ASC
  ), '[]'::JSONB)
  INTO result
  FROM public.branches b;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_branch_detail(p_branch_id UUID)
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
    'branch', to_jsonb(b),
    'staff', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'fullName', p.full_name, 'role', p.role, 'isActive', p.is_active) ORDER BY p.full_name)
      FROM public.profiles p
      WHERE p.branch_id = b.id
    ), '[]'::JSONB),
    'areas', COALESCE((
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a.name)
      FROM public.areas a
      WHERE a.branch_id = b.id
    ), '[]'::JSONB),
    'tables', COALESCE((
      SELECT jsonb_agg(to_jsonb(t) ORDER BY t.name)
      FROM public.tables t
      WHERE t.branch_id = b.id
    ), '[]'::JSONB),
    'printers', COALESCE((
      SELECT jsonb_agg(to_jsonb(pr) ORDER BY pr.name)
      FROM public.printers pr
      WHERE pr.branch_id = b.id
    ), '[]'::JSONB),
    'inventorySummary', jsonb_build_object(
      'items', COALESCE((SELECT COUNT(*) FROM public.inventory_items ii WHERE ii.branch_id = b.id AND COALESCE(ii.is_active, TRUE)), 0),
      'critical', COALESCE((SELECT COUNT(*) FROM public.inventory_items ii WHERE ii.branch_id = b.id AND COALESCE(ii.is_active, TRUE) AND COALESCE(ii.current_stock, 0) <= COALESCE(ii.min_stock, 0)), 0)
    ),
    'purchasesSummary', jsonb_build_object(
      'pending', COALESCE((SELECT COUNT(*) FROM public.purchases p WHERE p.branch_id = b.id AND p.status IN ('draft', 'ordered', 'partial')), 0),
      'month', COALESCE((SELECT COUNT(*) FROM public.purchases p WHERE p.branch_id = b.id AND p.purchase_date >= date_trunc('month', timezone('utc'::TEXT, now()))), 0)
    )
  )
  INTO result
  FROM public.branches b
  WHERE b.id = p_branch_id;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_branch_with_defaults(
  p_branch JSONB,
  p_create_defaults BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  branch_record public.branches%ROWTYPE;
  clean_name TEXT := NULLIF(trim(COALESCE(p_branch->>'name', '')), '');
BEGIN
  IF NOT public.user_can_manage_branches() THEN
    RAISE EXCEPTION 'permission denied for branch creation';
  END IF;

  IF clean_name IS NULL THEN
    RAISE EXCEPTION 'branch name is required';
  END IF;

  INSERT INTO public.branches (
    name,
    code,
    address,
    phone,
    email,
    timezone,
    opening_hours,
    is_active,
    is_main_office
  )
  VALUES (
    clean_name,
    NULLIF(upper(trim(COALESCE(p_branch->>'code', ''))), ''),
    NULLIF(trim(COALESCE(p_branch->>'address', '')), ''),
    NULLIF(trim(COALESCE(p_branch->>'phone', '')), ''),
    NULLIF(lower(trim(COALESCE(p_branch->>'email', ''))), ''),
    COALESCE(NULLIF(trim(COALESCE(p_branch->>'timezone', '')), ''), 'America/Mexico_City'),
    COALESCE(p_branch->'opening_hours', '{}'::JSONB),
    COALESCE((p_branch->>'is_active')::BOOLEAN, TRUE),
    COALESCE((p_branch->>'is_main_office')::BOOLEAN, FALSE)
  )
  RETURNING * INTO branch_record;

  IF branch_record.code IS NULL OR branch_record.code = '' THEN
    UPDATE public.branches
    SET code = upper(left(regexp_replace(branch_record.name, '[^a-zA-Z0-9]', '', 'g'), 4)) || '-' || upper(left(replace(branch_record.id::TEXT, '-', ''), 4))
    WHERE id = branch_record.id
    RETURNING * INTO branch_record;
  END IF;

  IF p_create_defaults THEN
    INSERT INTO public.areas(name, branch_id)
    SELECT 'Salon principal', branch_record.id
    WHERE EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'areas'
        AND column_name = 'branch_id'
    );
  END IF;

  RETURN to_jsonb(branch_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_branch(
  p_branch_id UUID,
  p_branch JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  branch_record public.branches%ROWTYPE;
BEGIN
  IF NOT public.user_can_manage_branches() THEN
    RAISE EXCEPTION 'permission denied for branch update';
  END IF;

  UPDATE public.branches
  SET name = COALESCE(NULLIF(trim(p_branch->>'name'), ''), name),
      code = COALESCE(NULLIF(upper(trim(p_branch->>'code')), ''), code),
      address = COALESCE(NULLIF(trim(p_branch->>'address'), ''), address),
      phone = COALESCE(NULLIF(trim(p_branch->>'phone'), ''), phone),
      email = COALESCE(NULLIF(lower(trim(p_branch->>'email')), ''), email),
      timezone = COALESCE(NULLIF(trim(p_branch->>'timezone'), ''), timezone),
      opening_hours = COALESCE(p_branch->'opening_hours', opening_hours),
      is_active = COALESCE((p_branch->>'is_active')::BOOLEAN, is_active),
      is_main_office = COALESCE((p_branch->>'is_main_office')::BOOLEAN, is_main_office),
      deactivated_at = CASE WHEN COALESCE((p_branch->>'is_active')::BOOLEAN, is_active) THEN NULL ELSE deactivated_at END,
      deactivation_reason = CASE WHEN COALESCE((p_branch->>'is_active')::BOOLEAN, is_active) THEN NULL ELSE deactivation_reason END,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_branch_id
  RETURNING * INTO branch_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'branch not found';
  END IF;

  RETURN to_jsonb(branch_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_branch(
  p_branch_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  branch_record public.branches%ROWTYPE;
BEGIN
  IF NOT public.user_can_manage_branches() THEN
    RAISE EXCEPTION 'permission denied for branch deactivation';
  END IF;

  IF NULLIF(trim(COALESCE(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'deactivation reason is required';
  END IF;

  UPDATE public.branches
  SET is_active = FALSE,
      deactivated_at = timezone('utc'::TEXT, now()),
      deactivation_reason = p_reason,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_branch_id
  RETURNING * INTO branch_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'branch not found';
  END IF;

  RETURN jsonb_build_object(
    'branchId', branch_record.id,
    'isActive', branch_record.is_active,
    'deactivatedAt', branch_record.deactivated_at,
    'reason', branch_record.deactivation_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_branches_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_branch_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_branch_with_defaults(JSONB, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_branch(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_branch(UUID, TEXT) TO authenticated;
