-- Catalog and menu MVP hardening.
-- Idempotent local migration: no remote SQL is executed by this file alone.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  branch_id UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  active_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

ALTER TABLE public.menus
ADD COLUMN IF NOT EXISTS branch_id UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS active_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

UPDATE public.menus
SET active_days = '[0,1,2,3,4,5,6]'::JSONB
WHERE active_days IS NULL OR jsonb_typeof(active_days) <> 'array';

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL;

ALTER TABLE public.product_recipes
ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(5, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_catalog_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_menu_id ON public.categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_printer_id ON public.categories(printer_id);
CREATE INDEX IF NOT EXISTS idx_catalog_menus_branch_id ON public.menus(branch_id);
CREATE INDEX IF NOT EXISTS idx_catalog_menus_is_active ON public.menus(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_product_recipes_product_id ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_recipes_inventory_item_id ON public.product_recipes(inventory_item_id);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT SELECT ON public.menus TO anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menus'
      AND policyname = 'Authenticated users can read menus'
  ) THEN
    CREATE POLICY "Authenticated users can read menus"
    ON public.menus
    FOR SELECT
    TO authenticated
    USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menus'
      AND policyname = 'Admin and manager users can insert menus'
  ) THEN
    CREATE POLICY "Admin and manager users can insert menus"
    ON public.menus
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menus'
      AND policyname = 'Admin and manager users can update menus'
  ) THEN
    CREATE POLICY "Admin and manager users can update menus"
    ON public.menus
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menus'
      AND policyname = 'Admin and manager users can delete menus'
  ) THEN
    CREATE POLICY "Admin and manager users can delete menus"
    ON public.menus
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
      )
    );
  END IF;
END $$;
