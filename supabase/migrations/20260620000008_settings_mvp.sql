-- Settings MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Mi Restaurante',
  business_name TEXT,
  rfc TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  tax_rate NUMERIC(10, 4) NOT NULL DEFAULT 0.16,
  tax_name TEXT NOT NULL DEFAULT 'IVA',
  ticket_header TEXT,
  ticket_footer TEXT DEFAULT 'Gracias por su visita!',
  is_electronic_invoicing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  points_per_currency NUMERIC(10, 4) NOT NULL DEFAULT 1,
  currency_unit_amount NUMERIC(10, 2) NOT NULL DEFAULT 10,
  daily_points_limit INTEGER NOT NULL DEFAULT 1000,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Mi Restaurante',
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS rfc TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN',
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(10, 4) NOT NULL DEFAULT 0.16,
ADD COLUMN IF NOT EXISTS tax_name TEXT NOT NULL DEFAULT 'IVA',
ADD COLUMN IF NOT EXISTS ticket_header TEXT,
ADD COLUMN IF NOT EXISTS ticket_footer TEXT DEFAULT 'Gracias por su visita!',
ADD COLUMN IF NOT EXISTS is_electronic_invoicing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS points_per_currency NUMERIC(10, 4) NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS currency_unit_amount NUMERIC(10, 2) NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS daily_points_limit INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

UPDATE public.business_settings
SET business_name = COALESCE(NULLIF(business_name, ''), NULLIF(name, ''), 'Mi Restaurante'),
    name = COALESCE(NULLIF(name, ''), NULLIF(business_name, ''), 'Mi Restaurante'),
    currency = COALESCE(NULLIF(currency, ''), 'MXN'),
    tax_rate = COALESCE(tax_rate, 0.16),
    tax_name = COALESCE(NULLIF(tax_name, ''), 'IVA'),
    points_per_currency = COALESCE(points_per_currency, 1),
    currency_unit_amount = COALESCE(currency_unit_amount, 10),
    daily_points_limit = COALESCE(daily_points_limit, 1000);

INSERT INTO public.business_settings (name, business_name)
SELECT 'Mi Restaurante', 'Mi Restaurante'
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_scope TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

CREATE INDEX IF NOT EXISTS idx_settings_audit_scope_created
ON public.settings_audit_log(setting_scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_audit_changed_by
ON public.settings_audit_log(changed_by);

CREATE TABLE IF NOT EXISTS public.printers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  connection_type TEXT DEFAULT 'network',
  ip_address TEXT,
  port INTEGER DEFAULT 9100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'network',
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 9100,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

CREATE INDEX IF NOT EXISTS idx_settings_printers_branch_active
ON public.printers(branch_id, is_active);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.business_settings TO authenticated;
GRANT SELECT, INSERT ON public.settings_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.printers TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_can_manage_settings()
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

CREATE OR REPLACE FUNCTION public.user_can_read_operational_settings()
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
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_manage_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_operational_settings() TO authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.business_settings;
  DROP POLICY IF EXISTS "Enable update for admins only" ON public.business_settings;
  DROP POLICY IF EXISTS "Settings users can read business_settings" ON public.business_settings;
  DROP POLICY IF EXISTS "Settings admins can write business_settings" ON public.business_settings;
  DROP POLICY IF EXISTS "Settings admins can read audit log" ON public.settings_audit_log;
  DROP POLICY IF EXISTS "Settings admins can insert audit log" ON public.settings_audit_log;
  DROP POLICY IF EXISTS "Enable all for authenticated users on printers" ON public.printers;
  DROP POLICY IF EXISTS "Settings users can read printers" ON public.printers;
  DROP POLICY IF EXISTS "Settings admins can write printers" ON public.printers;
END $$;

CREATE POLICY "Settings users can read business_settings"
ON public.business_settings
FOR SELECT
TO authenticated
USING (public.user_can_read_operational_settings());

CREATE POLICY "Settings admins can write business_settings"
ON public.business_settings
FOR ALL
TO authenticated
USING (public.user_can_manage_settings())
WITH CHECK (public.user_can_manage_settings());

CREATE POLICY "Settings admins can read audit log"
ON public.settings_audit_log
FOR SELECT
TO authenticated
USING (public.user_can_manage_settings());

CREATE POLICY "Settings admins can insert audit log"
ON public.settings_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_manage_settings());

CREATE POLICY "Settings users can read printers"
ON public.printers
FOR SELECT
TO authenticated
USING (
  public.user_can_read_operational_settings()
  AND COALESCE(is_active, TRUE)
);

CREATE POLICY "Settings admins can write printers"
ON public.printers
FOR ALL
TO authenticated
USING (public.user_can_manage_settings())
WITH CHECK (public.user_can_manage_settings());

CREATE OR REPLACE FUNCTION public.get_business_settings()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  settings_record public.business_settings%ROWTYPE;
BEGIN
  SELECT * INTO settings_record
  FROM public.business_settings
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN COALESCE(to_jsonb(settings_record), '{}'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_business_settings(p_settings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  settings_id UUID;
  old_record public.business_settings%ROWTYPE;
  new_record public.business_settings%ROWTYPE;
  audit_key TEXT;
BEGIN
  IF NOT public.user_can_manage_settings() THEN
    RAISE EXCEPTION 'permission denied for settings update';
  END IF;

  SELECT * INTO old_record
  FROM public.business_settings
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.business_settings(name, business_name, updated_by)
    VALUES ('Mi Restaurante', 'Mi Restaurante', auth.uid())
    RETURNING * INTO old_record;
  END IF;

  settings_id := old_record.id;

  UPDATE public.business_settings
  SET name = COALESCE(NULLIF(trim(p_settings->>'name'), ''), name),
      business_name = COALESCE(NULLIF(trim(COALESCE(p_settings->>'business_name', p_settings->>'name')), ''), business_name, name),
      rfc = COALESCE(NULLIF(upper(trim(p_settings->>'rfc')), ''), rfc),
      address = COALESCE(NULLIF(trim(p_settings->>'address'), ''), address),
      phone = COALESCE(NULLIF(trim(p_settings->>'phone'), ''), phone),
      email = COALESCE(NULLIF(lower(trim(p_settings->>'email')), ''), email),
      website = COALESCE(NULLIF(trim(p_settings->>'website'), ''), website),
      logo_url = COALESCE(NULLIF(trim(p_settings->>'logo_url'), ''), logo_url),
      currency = COALESCE(NULLIF(upper(trim(p_settings->>'currency')), ''), currency, 'MXN'),
      tax_rate = COALESCE(NULLIF(p_settings->>'tax_rate', '')::NUMERIC, tax_rate, 0.16),
      tax_name = COALESCE(NULLIF(trim(p_settings->>'tax_name'), ''), tax_name, 'IVA'),
      ticket_header = COALESCE(p_settings->>'ticket_header', ticket_header),
      ticket_footer = COALESCE(p_settings->>'ticket_footer', ticket_footer),
      is_electronic_invoicing_enabled = COALESCE(NULLIF(p_settings->>'is_electronic_invoicing_enabled', '')::BOOLEAN, is_electronic_invoicing_enabled, FALSE),
      points_per_currency = COALESCE(NULLIF(p_settings->>'points_per_currency', '')::NUMERIC, points_per_currency, 1),
      currency_unit_amount = GREATEST(COALESCE(NULLIF(p_settings->>'currency_unit_amount', '')::NUMERIC, currency_unit_amount, 10), 0.01),
      daily_points_limit = GREATEST(COALESCE(NULLIF(p_settings->>'daily_points_limit', '')::INTEGER, daily_points_limit, 1000), 1),
      updated_by = auth.uid(),
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = settings_id
  RETURNING * INTO new_record;

  FOREACH audit_key IN ARRAY ARRAY[
    'name',
    'business_name',
    'rfc',
    'address',
    'phone',
    'email',
    'website',
    'logo_url',
    'currency',
    'tax_rate',
    'tax_name',
    'ticket_header',
    'ticket_footer',
    'is_electronic_invoicing_enabled',
    'points_per_currency',
    'currency_unit_amount',
    'daily_points_limit'
  ]
  LOOP
    IF (to_jsonb(old_record)->audit_key) IS DISTINCT FROM (to_jsonb(new_record)->audit_key) THEN
      INSERT INTO public.settings_audit_log(setting_scope, setting_key, old_value, new_value, changed_by)
      VALUES (
        'business_settings',
        audit_key,
        to_jsonb(old_record)->audit_key,
        to_jsonb(new_record)->audit_key,
        auth.uid()
      );
    END IF;
  END LOOP;

  RETURN to_jsonb(new_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_settings_dashboard(p_branch_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  settings_record public.business_settings%ROWTYPE;
BEGIN
  SELECT * INTO settings_record
  FROM public.business_settings
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'fiscalComplete', (
      NULLIF(COALESCE(settings_record.name, settings_record.business_name, ''), '') IS NOT NULL
      AND NULLIF(COALESCE(settings_record.rfc, ''), '') IS NOT NULL
      AND COALESCE(settings_record.tax_rate, 0) >= 0
    ),
    'ticketConfigured', (
      NULLIF(COALESCE(settings_record.ticket_header, ''), '') IS NOT NULL
      OR NULLIF(COALESCE(settings_record.ticket_footer, ''), '') IS NOT NULL
    ),
    'electronicInvoicingEnabled', COALESCE(settings_record.is_electronic_invoicing_enabled, FALSE),
    'activePrinters', COALESCE((
      SELECT COUNT(*)
      FROM public.printers p
      WHERE COALESCE(p.is_active, TRUE)
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
    ), 0),
    'lastUpdatedAt', settings_record.updated_at,
    'lastUpdatedBy', (
      SELECT pr.full_name
      FROM public.profiles pr
      WHERE pr.id = settings_record.updated_by
      LIMIT 1
    ),
    'auditCount', COALESCE((
      SELECT COUNT(*)
      FROM public.settings_audit_log
    ), 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_printer_config(p_printer JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  printer_record public.printers%ROWTYPE;
  old_record public.printers%ROWTYPE;
  printer_id UUID := NULLIF(p_printer->>'id', '')::UUID;
  target_branch_id UUID := NULLIF(p_printer->>'branch_id', '')::UUID;
BEGIN
  IF NOT public.user_can_manage_settings() THEN
    RAISE EXCEPTION 'permission denied for printer configuration';
  END IF;

  IF NULLIF(trim(COALESCE(p_printer->>'name', '')), '') IS NULL THEN
    RAISE EXCEPTION 'printer name is required';
  END IF;

  IF target_branch_id IS NULL THEN
    RAISE EXCEPTION 'branch is required for printer configuration';
  END IF;

  IF printer_id IS NULL THEN
    INSERT INTO public.printers(name, branch_id, connection_type, ip_address, port, is_active, updated_at)
    VALUES (
      trim(p_printer->>'name'),
      target_branch_id,
      COALESCE(NULLIF(p_printer->>'connection_type', ''), 'network'),
      NULLIF(trim(COALESCE(p_printer->>'ip_address', '')), ''),
      COALESCE(NULLIF(p_printer->>'port', '')::INTEGER, 9100),
      TRUE,
      timezone('utc'::TEXT, now())
    )
    RETURNING * INTO printer_record;

    INSERT INTO public.settings_audit_log(setting_scope, setting_key, old_value, new_value, changed_by)
    VALUES ('printers', 'create', NULL, to_jsonb(printer_record), auth.uid());
  ELSE
    SELECT * INTO old_record
    FROM public.printers
    WHERE id = printer_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'printer not found';
    END IF;

    UPDATE public.printers
    SET name = trim(p_printer->>'name'),
        branch_id = target_branch_id,
        connection_type = COALESCE(NULLIF(p_printer->>'connection_type', ''), connection_type, 'network'),
        ip_address = NULLIF(trim(COALESCE(p_printer->>'ip_address', '')), ''),
        port = COALESCE(NULLIF(p_printer->>'port', '')::INTEGER, port, 9100),
        is_active = COALESCE(NULLIF(p_printer->>'is_active', '')::BOOLEAN, is_active, TRUE),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = printer_id
    RETURNING * INTO printer_record;

    INSERT INTO public.settings_audit_log(setting_scope, setting_key, old_value, new_value, changed_by)
    VALUES ('printers', 'update', to_jsonb(old_record), to_jsonb(printer_record), auth.uid());
  END IF;

  RETURN to_jsonb(printer_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_printer_config(p_printer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  old_record public.printers%ROWTYPE;
  printer_record public.printers%ROWTYPE;
BEGIN
  IF NOT public.user_can_manage_settings() THEN
    RAISE EXCEPTION 'permission denied for printer deactivation';
  END IF;

  SELECT * INTO old_record
  FROM public.printers
  WHERE id = p_printer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'printer not found';
  END IF;

  UPDATE public.printers
  SET is_active = FALSE,
      updated_at = timezone('utc'::TEXT, now())
  WHERE id = p_printer_id
  RETURNING * INTO printer_record;

  INSERT INTO public.settings_audit_log(setting_scope, setting_key, old_value, new_value, changed_by)
  VALUES ('printers', 'deactivate', to_jsonb(old_record), to_jsonb(printer_record), auth.uid());

  RETURN jsonb_build_object('printerId', p_printer_id, 'isActive', FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_business_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_business_settings(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_settings_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_printer_config(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_printer_config(UUID) TO authenticated;
