-- Fix RLS policies for PIN login (anon role)
-- PIN login users are anon (no Auth session), so they need RLS policies too.
-- This is safe for local development; in production all users use Auth.

-- Profiles: allow anon to manage for staff management
DROP POLICY IF EXISTS anon_profiles_all ON public.profiles;
CREATE POLICY anon_profiles_all
  ON public.profiles
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Branches: allow anon to manage for branch data
DROP POLICY IF EXISTS anon_branches_all ON public.branches;
CREATE POLICY anon_branches_all
  ON public.branches
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Categories: allow anon for POS catalog
DROP POLICY IF EXISTS anon_categories_all ON public.categories;
CREATE POLICY anon_categories_all
  ON public.categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Menus: allow anon (needed for categories join in POS)
DROP POLICY IF EXISTS anon_menus_all ON public.menus;
CREATE POLICY anon_menus_all
  ON public.menus
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Business settings: allow anon for POS settings
DROP POLICY IF EXISTS anon_business_settings_all ON public.business_settings;
CREATE POLICY anon_business_settings_all
  ON public.business_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Staff config: allow anon for welcome template management
DROP POLICY IF EXISTS anon_staff_config_all ON public.staff_config;
CREATE POLICY anon_staff_config_all
  ON public.staff_config
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Products: allow anon to read for public QR menu
DROP POLICY IF EXISTS anon_products_select ON public.products;
CREATE POLICY anon_products_select
  ON public.products
  FOR SELECT
  TO anon
  USING (true);

-- Tables: allow anon to read for public QR menu
DROP POLICY IF EXISTS anon_tables_select ON public.tables;
CREATE POLICY anon_tables_select
  ON public.tables
  FOR SELECT
  TO anon
  USING (true);
