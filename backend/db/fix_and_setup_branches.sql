-- 1. Create inventory_alerts table (Fixes 404 error)
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    branch_id UUID, -- Will link to branches later
    item_name TEXT NOT NULL,
    current_stock NUMERIC(10, 4) NOT NULL,
    min_stock NUMERIC(10, 4) NOT NULL,
    unit TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'critical'
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure RLS for alerts
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users on inventory_alerts" ON public.inventory_alerts;
CREATE POLICY "Enable all for authenticated users on inventory_alerts" ON public.inventory_alerts FOR ALL TO authenticated USING (true);

-- 3. Create Default Branch if not exists
INSERT INTO public.branches (name, is_main_office, is_active)
SELECT 'Matriz Principal', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.branches);

-- 4. Associate existing orphaned data with the first branch
DO $$
DECLARE
    first_branch_id UUID;
BEGIN
    SELECT id INTO first_branch_id FROM public.branches LIMIT 1;
    
    IF first_branch_id IS NOT NULL THEN
        UPDATE public.profiles SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.areas SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.tables SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.inventory_items SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.inventory_alerts SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.orders SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.purchases SET branch_id = first_branch_id WHERE branch_id IS NULL;
        UPDATE public.suppliers SET branch_id = first_branch_id WHERE branch_id IS NULL;
    END IF;
END $$;
