-- Fix RLS policies for branches table
-- This script ensures that authenticated users can perform all operations on branches.

-- 1. Enable RLS (just in case)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all for authenticated on branches" ON public.branches;
DROP POLICY IF EXISTS "Allow authenticated users to read branches" ON public.branches;
DROP POLICY IF EXISTS "Allow authenticated users to insert branches" ON public.branches;
DROP POLICY IF EXISTS "Allow authenticated users to update branches" ON public.branches;
DROP POLICY IF EXISTS "Allow authenticated users to delete branches" ON public.branches;

-- 3. Create comprehensive policies
-- Policy for SELECT
CREATE POLICY "Allow authenticated users to read branches"
ON public.branches FOR SELECT
TO authenticated
USING (true);

-- Policy for INSERT
CREATE POLICY "Allow authenticated users to insert branches"
ON public.branches FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE
CREATE POLICY "Allow authenticated users to update branches"
ON public.branches FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE
CREATE POLICY "Allow authenticated users to delete branches"
ON public.branches FOR DELETE
TO authenticated
USING (true);
