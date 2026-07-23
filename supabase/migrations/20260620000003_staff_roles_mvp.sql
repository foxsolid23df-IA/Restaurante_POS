-- Staff and roles MVP hardening.
-- Local migration only; apply remotely after review.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS private;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'captain';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cashier';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'waiter';
  END IF;
END $$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pin_code_hash TEXT;

UPDATE public.profiles
SET permissions = CASE
  WHEN role = 'admin' THEN jsonb_build_object(
    'access_admin', true,
    'access_pos', true,
    'view_reports', true,
    'manage_inventory', true,
    'manage_staff', true,
    'modify_prices', true,
    'delete_orders', true
  )
  WHEN role = 'manager' THEN jsonb_build_object(
    'access_admin', true,
    'access_pos', true,
    'view_reports', true,
    'manage_inventory', true,
    'manage_staff', false,
    'modify_prices', true,
    'delete_orders', true
  )
  WHEN role = 'cashier' THEN jsonb_build_object(
    'access_admin', false,
    'access_pos', true,
    'view_reports', false,
    'manage_inventory', true,
    'manage_staff', false,
    'modify_prices', false,
    'delete_orders', false
  )
  ELSE jsonb_build_object(
    'access_admin', false,
    'access_pos', true,
    'view_reports', false,
    'manage_inventory', false,
    'manage_staff', false,
    'modify_prices', false,
    'delete_orders', false
  )
END
WHERE permissions IS NULL OR permissions = '{}'::JSONB;

UPDATE public.profiles
SET pin_code_hash = encode(digest(pin_code, 'sha256'), 'hex')
WHERE pin_code_hash IS NULL
  AND pin_code IS NOT NULL
  AND length(pin_code) = 4;

CREATE TABLE IF NOT EXISTS public.staff_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  welcome_template TEXT NOT NULL DEFAULT 'Hola {full_name},

Bienvenido al equipo de {business_name}.

Correo: {email}
PIN POS: {pin_code}

Guarda esta informacion de forma segura.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_email ON public.profiles(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_pin_code_hash
ON public.profiles(pin_code_hash)
WHERE pin_code_hash IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_config ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.staff_config TO authenticated;

CREATE OR REPLACE FUNCTION private.current_user_can_manage_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles manager
    WHERE manager.id = auth.uid()
      AND manager.is_active = TRUE
      AND (
        manager.role = 'admin'
        OR COALESCE((manager.permissions->>'manage_staff')::BOOLEAN, false)
      )
  );
$$;

REVOKE ALL ON FUNCTION private.current_user_can_manage_staff() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_can_manage_staff() TO authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow users to read all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Allow anonymous users to read profiles for PIN login" ON public.profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Staff managers can read profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Staff managers can update profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Staff managers can read staff_config" ON public.staff_config;
  DROP POLICY IF EXISTS "Staff managers can write staff_config" ON public.staff_config;
END $$;

CREATE POLICY "Staff managers can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR private.current_user_can_manage_staff()
);

CREATE POLICY "Staff managers can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (private.current_user_can_manage_staff())
WITH CHECK (private.current_user_can_manage_staff());

CREATE POLICY "Staff managers can read staff_config"
ON public.staff_config
FOR SELECT
TO authenticated
USING (private.current_user_can_manage_staff());

CREATE POLICY "Staff managers can write staff_config"
ON public.staff_config
FOR ALL
TO authenticated
USING (private.current_user_can_manage_staff())
WITH CHECK (private.current_user_can_manage_staff());

DROP FUNCTION IF EXISTS public.verify_pin(TEXT);

CREATE OR REPLACE FUNCTION public.verify_pin(p_pin TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role user_role,
  is_active BOOLEAN,
  branch_id UUID,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_pin IS NULL OR p_pin !~ '^\d{4}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.profiles profile
  SET last_login_at = NOW(),
      updated_at = NOW()
  WHERE profile.is_active = TRUE
    AND (
      profile.pin_code_hash = encode(digest(p_pin, 'sha256'), 'hex')
      OR (
        profile.pin_code_hash IS NULL
        AND profile.pin_code = p_pin
      )
    )
  RETURNING
    profile.id,
    profile.full_name,
    profile.role,
    profile.is_active,
    profile.branch_id,
    profile.permissions;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_pin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_pin(TEXT) TO anon, authenticated;
