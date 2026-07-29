-- Fix PIN login in Supabase
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/ymbgtiuixbqyhgigttgs/editor)

-- 1. Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Recreate verify_pin function with robust hashing
DROP FUNCTION IF EXISTS public.verify_pin(TEXT);

CREATE OR REPLACE FUNCTION public.verify_pin(p_pin TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role public.user_role,
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

-- 3. Ensure profiles have pin_code_hash for plain-text pins
UPDATE public.profiles
SET pin_code_hash = encode(digest(pin_code, 'sha256'), 'hex')
WHERE pin_code_hash IS NULL
  AND pin_code IS NOT NULL
  AND length(pin_code) = 4;

-- 4. Ensure RLS policies allow anonymous (POS) access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_profiles_all ON public.profiles;
CREATE POLICY anon_profiles_all
  ON public.profiles
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_branches_all ON public.branches;
CREATE POLICY anon_branches_all
  ON public.branches
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_categories_all ON public.categories;
CREATE POLICY anon_categories_all
  ON public.categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_menus_all ON public.menus;
CREATE POLICY anon_menus_all
  ON public.menus
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_products_all ON public.products;
CREATE POLICY anon_products_all
  ON public.products
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_areas_all ON public.areas;
CREATE POLICY anon_areas_all
  ON public.areas
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_tables_all ON public.tables;
CREATE POLICY anon_tables_all
  ON public.tables
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_business_settings_all ON public.business_settings;
CREATE POLICY anon_business_settings_all
  ON public.business_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
