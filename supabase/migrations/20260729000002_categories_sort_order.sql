-- Add sort_order column to categories table
-- Required for ORDER BY c.sort_order in POS category queries

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_catalog_categories_sort_order ON public.categories(sort_order);
