-- CRM and loyalty MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT,
  tax_rate NUMERIC(5, 4) DEFAULT 0.16,
  points_per_currency NUMERIC(10, 4) DEFAULT 1,
  currency_unit_amount NUMERIC(10, 2) DEFAULT 10,
  daily_points_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS points_per_currency NUMERIC(10, 4) DEFAULT 1,
ADD COLUMN IF NOT EXISTS currency_unit_amount NUMERIC(10, 2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS daily_points_limit INTEGER DEFAULT 1000;

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  reservation_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  pax INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 120,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL DEFAULT 100,
  icon_name TEXT DEFAULT 'Gift',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.loyalty_rewards
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  balance_before INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  description TEXT,
  is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  alert_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.loyalty_transactions
ADD COLUMN IF NOT EXISTS balance_before INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_after INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS alert_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_customers_branch_active ON public.customers(branch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_crm_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_crm_customers_last_visit ON public.customers(last_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_reservations_branch_date ON public.reservations(branch_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_crm_reservations_customer ON public.reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_reservations_table_status ON public.reservations(table_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_customer_created ON public.loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_order ON public.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_crm_loyalty_suspicious ON public.loyalty_transactions(is_suspicious, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_rewards_branch_active ON public.loyalty_rewards(branch_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_loyalty_order_earn_once
ON public.loyalty_transactions(order_id)
WHERE order_id IS NOT NULL AND transaction_type = 'earn';

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;

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

CREATE OR REPLACE FUNCTION public.user_can_access_crm()
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
        p.role IN ('admin', 'manager', 'cashier', 'waiter')
        OR COALESCE((p.permissions ->> 'access_admin')::BOOLEAN, FALSE)
        OR COALESCE((p.permissions ->> 'access_pos')::BOOLEAN, FALSE)
        OR COALESCE((p.permissions ->> 'view_reports')::BOOLEAN, FALSE)
      )
  );
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'customers',
    'reservations',
    'loyalty_transactions',
    'loyalty_rewards'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Enable all for authenticated users on %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "CRM users can read %I" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "CRM managers can write %I" ON public.%I', table_name, table_name);

    EXECUTE format(
      'CREATE POLICY "CRM users can read %I" ON public.%I FOR SELECT TO authenticated USING (public.user_can_access_crm())',
      table_name,
      table_name
    );

    EXECUTE format(
      'CREATE POLICY "CRM managers can write %I" ON public.%I FOR ALL TO authenticated USING (public.user_has_permission(''access_admin'') OR public.user_has_permission(''view_reports'') OR public.user_has_permission(''manage_staff'') OR public.user_has_permission(''access_pos'')) WITH CHECK (public.user_has_permission(''access_admin'') OR public.user_has_permission(''view_reports'') OR public.user_has_permission(''manage_staff'') OR public.user_has_permission(''access_pos''))',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_customer_from_pos(
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  customer_record public.customers%ROWTYPE;
  normalized_phone TEXT;
  normalized_email TEXT;
BEGIN
  normalized_phone := NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '');
  normalized_email := NULLIF(lower(trim(COALESCE(p_email, ''))), '');

  SELECT * INTO customer_record
  FROM public.customers
  WHERE COALESCE(is_active, TRUE)
    AND (
      (normalized_phone IS NOT NULL AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = normalized_phone)
      OR (normalized_email IS NOT NULL AND lower(COALESCE(email, '')) = normalized_email)
    )
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.customers
    SET name = COALESCE(NULLIF(trim(p_name), ''), name),
        phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
        email = COALESCE(normalized_email, email),
        branch_id = COALESCE(branch_id, p_branch_id),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = customer_record.id
    RETURNING * INTO customer_record;
  ELSE
    INSERT INTO public.customers(name, phone, email, branch_id, created_by)
    VALUES (
      COALESCE(NULLIF(trim(p_name), ''), 'Cliente sin nombre'),
      NULLIF(trim(p_phone), ''),
      normalized_email,
      p_branch_id,
      auth.uid()
    )
    RETURNING * INTO customer_record;
  END IF;

  RETURN to_jsonb(customer_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.award_order_loyalty_points(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  order_record public.orders%ROWTYPE;
  customer_record public.customers%ROWTYPE;
  settings_record public.business_settings%ROWTYPE;
  points_per_currency NUMERIC := 1;
  currency_unit NUMERIC := 10;
  daily_limit INTEGER := 1000;
  points_to_award INTEGER := 0;
  points_today INTEGER := 0;
  is_suspicious BOOLEAN := FALSE;
BEGIN
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND OR order_record.customer_id IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'order_without_customer');
  END IF;

  IF COALESCE(order_record.payment_status, 'pending') <> 'paid' AND COALESCE(order_record.status, '') <> 'completed' THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'order_not_paid');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.loyalty_transactions
    WHERE order_id = p_order_id
      AND transaction_type = 'earn'
  ) THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'already_awarded');
  END IF;

  SELECT * INTO customer_record
  FROM public.customers
  WHERE id = order_record.customer_id
  FOR UPDATE;

  IF NOT FOUND OR COALESCE(customer_record.is_active, TRUE) = FALSE THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'customer_inactive');
  END IF;

  SELECT * INTO settings_record
  FROM public.business_settings
  ORDER BY created_at ASC
  LIMIT 1;

  IF FOUND THEN
    points_per_currency := COALESCE(settings_record.points_per_currency, 1);
    currency_unit := GREATEST(COALESCE(settings_record.currency_unit_amount, 10), 0.01);
    daily_limit := COALESCE(settings_record.daily_points_limit, 1000);
  END IF;

  points_to_award := FLOOR((COALESCE(order_record.total_amount, 0) / currency_unit) * points_per_currency);

  IF points_to_award <= 0 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'zero_points');
  END IF;

  SELECT COALESCE(SUM(points), 0) INTO points_today
  FROM public.loyalty_transactions
  WHERE customer_id = customer_record.id
    AND transaction_type = 'earn'
    AND created_at >= date_trunc('day', timezone('utc'::TEXT, now()));

  is_suspicious := points_today + points_to_award > daily_limit;

  INSERT INTO public.loyalty_transactions(
    customer_id,
    points,
    balance_before,
    balance_after,
    transaction_type,
    order_id,
    description,
    is_suspicious,
    alert_reason,
    created_by
  )
  VALUES (
    customer_record.id,
    points_to_award,
    COALESCE(customer_record.loyalty_points, 0),
    COALESCE(customer_record.loyalty_points, 0) + points_to_award,
    'earn',
    order_record.id,
    'Compra en orden #' || order_record.id::TEXT,
    is_suspicious,
    CASE WHEN is_suspicious THEN 'Excede limite diario de ' || daily_limit || ' pts' ELSE NULL END,
    auth.uid()
  );

  UPDATE public.customers
  SET loyalty_points = COALESCE(loyalty_points, 0) + points_to_award,
      total_spent = COALESCE(total_spent, 0) + COALESCE(order_record.total_amount, 0),
      visit_count = COALESCE(visit_count, 0) + 1,
      last_visit_at = COALESCE(order_record.closed_at, timezone('utc'::TEXT, now())),
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = customer_record.id;

  RETURN jsonb_build_object('awarded', true, 'points', points_to_award, 'customerId', customer_record.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_loyalty_points(
  p_customer_id UUID,
  p_points INTEGER,
  p_type TEXT,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  customer_record public.customers%ROWTYPE;
  delta INTEGER;
  next_balance INTEGER;
BEGIN
  IF NOT (public.user_has_permission('access_admin') OR public.user_has_permission('view_reports') OR public.user_has_permission('manage_staff')) THEN
    RAISE EXCEPTION 'permission denied for loyalty adjustment';
  END IF;

  IF COALESCE(p_points, 0) = 0 OR NULLIF(trim(COALESCE(p_description, '')), '') IS NULL THEN
    RAISE EXCEPTION 'points and description are required';
  END IF;

  SELECT * INTO customer_record
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'customer not found';
  END IF;

  delta := CASE WHEN p_type = 'redeem' THEN -ABS(p_points) ELSE p_points END;
  next_balance := COALESCE(customer_record.loyalty_points, 0) + delta;

  IF next_balance < 0 THEN
    RAISE EXCEPTION 'insufficient points';
  END IF;

  INSERT INTO public.loyalty_transactions(
    customer_id,
    points,
    balance_before,
    balance_after,
    transaction_type,
    description,
    created_by
  )
  VALUES (
    p_customer_id,
    delta,
    COALESCE(customer_record.loyalty_points, 0),
    next_balance,
    COALESCE(NULLIF(p_type, ''), 'adjust'),
    p_description,
    auth.uid()
  );

  UPDATE public.customers
  SET loyalty_points = next_balance,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_customer_id;

  RETURN jsonb_build_object('customerId', p_customer_id, 'balanceBefore', customer_record.loyalty_points, 'balanceAfter', next_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(
  p_customer_id UUID,
  p_reward_id UUID,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  customer_record public.customers%ROWTYPE;
  reward_record public.loyalty_rewards%ROWTYPE;
  next_balance INTEGER;
BEGIN
  SELECT * INTO customer_record
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND OR COALESCE(customer_record.is_active, TRUE) = FALSE THEN
    RAISE EXCEPTION 'customer not found';
  END IF;

  SELECT * INTO reward_record
  FROM public.loyalty_rewards
  WHERE id = p_reward_id
    AND COALESCE(is_active, TRUE)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward not found';
  END IF;

  IF customer_record.loyalty_points < reward_record.points_cost THEN
    RAISE EXCEPTION 'insufficient points';
  END IF;

  next_balance := customer_record.loyalty_points - reward_record.points_cost;

  INSERT INTO public.loyalty_transactions(
    customer_id,
    points,
    balance_before,
    balance_after,
    transaction_type,
    order_id,
    reward_id,
    description,
    created_by
  )
  VALUES (
    customer_record.id,
    -reward_record.points_cost,
    customer_record.loyalty_points,
    next_balance,
    'redeem',
    p_order_id,
    reward_record.id,
    'Canje: ' || reward_record.title,
    auth.uid()
  );

  UPDATE public.customers
  SET loyalty_points = next_balance,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = customer_record.id;

  RETURN jsonb_build_object('customerId', customer_record.id, 'rewardId', reward_record.id, 'balanceAfter', next_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_profile(p_customer_id UUID)
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
    'customer', to_jsonb(c),
    'orders', COALESCE((
      SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC)
      FROM public.orders o
      WHERE o.customer_id = c.id
    ), '[]'::JSONB),
    'loyaltyTransactions', COALESCE((
      SELECT jsonb_agg(to_jsonb(lt) ORDER BY lt.created_at DESC)
      FROM public.loyalty_transactions lt
      WHERE lt.customer_id = c.id
    ), '[]'::JSONB),
    'reservations', COALESCE((
      SELECT jsonb_agg(to_jsonb(r) ORDER BY r.reservation_date DESC)
      FROM public.reservations r
      WHERE r.customer_id = c.id
    ), '[]'::JSONB)
  )
  INTO result
  FROM public.customers c
  WHERE c.id = p_customer_id;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_crm_dashboard(p_branch_id UUID DEFAULT NULL)
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
    'activeCustomers', COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE)),
    'vipCustomers', COUNT(*) FILTER (WHERE COALESCE(loyalty_points, 0) >= 500 AND COALESCE(is_active, TRUE)),
    'pointsInCirculation', COALESCE(SUM(COALESCE(loyalty_points, 0)) FILTER (WHERE COALESCE(is_active, TRUE)), 0),
    'totalSpent', COALESCE(SUM(COALESCE(total_spent, 0)) FILTER (WHERE COALESCE(is_active, TRUE)), 0),
    'averageTicket', CASE WHEN COALESCE(SUM(visit_count), 0) > 0 THEN COALESCE(SUM(total_spent), 0) / COALESCE(SUM(visit_count), 0) ELSE 0 END,
    'reservationsUpcoming', COALESCE((
      SELECT COUNT(*)
      FROM public.reservations r
      WHERE r.reservation_date >= timezone('utc'::TEXT, now())
        AND r.status IN ('pending', 'confirmed')
        AND (p_branch_id IS NULL OR r.branch_id = p_branch_id)
    ), 0),
    'activeRewards', COALESCE((
      SELECT COUNT(*)
      FROM public.loyalty_rewards lr
      WHERE COALESCE(lr.is_active, TRUE)
        AND (p_branch_id IS NULL OR lr.branch_id IS NULL OR lr.branch_id = p_branch_id)
    ), 0),
    'loyaltyAlerts', COALESCE((
      SELECT COUNT(*)
      FROM public.loyalty_transactions lt
      JOIN public.customers c2 ON c2.id = lt.customer_id
      WHERE lt.is_suspicious
        AND (p_branch_id IS NULL OR c2.branch_id IS NULL OR c2.branch_id = p_branch_id)
    ), 0)
  )
  INTO result
  FROM public.customers c
  WHERE p_branch_id IS NULL OR c.branch_id IS NULL OR c.branch_id = p_branch_id;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_can_access_crm() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_customer_from_pos(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_order_loyalty_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_loyalty_points(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_reward(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_dashboard(UUID) TO authenticated;
