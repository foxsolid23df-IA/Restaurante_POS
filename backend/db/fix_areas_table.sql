-- Fix areas table by adding missing columns used in the frontend
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#064e3b';

-- Ensure branch_id is present (it should be from multi_branch_schema, but just in case)
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Update existing areas to have a default color if missing
UPDATE public.areas SET color = '#064e3b' WHERE color IS NULL;
