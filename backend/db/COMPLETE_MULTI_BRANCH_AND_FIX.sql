-- Definitive Multi-Branch System Setup & Fixes (V2 - Includes missing Purchases tables)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    is_main_office BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENSURE SUPPLIERS & PURCHASES TABLES EXIST
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invoice_number TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'completed',
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    notes TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ADD BRANCH_ID TO CORE TABLES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 5. INVENTORY ALERTS TABLE (Fixes 404 error)
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    item_name TEXT NOT NULL,
    current_stock NUMERIC(10, 4) NOT NULL,
    min_stock NUMERIC(10, 4) NOT NULL,
    unit TEXT NOT NULL,
    severity TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. INVENTORY TRANSFERS
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_branch_id UUID REFERENCES public.branches(id) NOT NULL,
    to_branch_id UUID REFERENCES public.branches(id) NOT NULL,
    requested_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transfer_id UUID REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
    inventory_item_id UUID, 
    quantity NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ENABLE RLS & POLICIES
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Reset policies to avoid duplicates
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable all for authenticated on branches" ON public.branches;
    DROP POLICY IF EXISTS "Enable all for authenticated on inventory_alerts" ON public.inventory_alerts;
    DROP POLICY IF EXISTS "Enable all for authenticated on inventory_transfers" ON public.inventory_transfers;
    DROP POLICY IF EXISTS "Enable all for authenticated on inventory_transfer_items" ON public.inventory_transfer_items;
    DROP POLICY IF EXISTS "Enable all for authenticated on suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Enable all for authenticated on purchases" ON public.purchases;
END $$;

CREATE POLICY "Enable all for authenticated on branches" ON public.branches FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on inventory_alerts" ON public.inventory_alerts FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on inventory_transfers" ON public.inventory_transfers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on inventory_transfer_items" ON public.inventory_transfer_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on suppliers" ON public.suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated on purchases" ON public.purchases FOR ALL TO authenticated USING (true);

-- 8. INITIAL DATA & SEEDING
INSERT INTO public.branches (name, is_main_office, is_active)
SELECT 'Matriz Principal', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.branches);

-- 9. ASSOCIATE EXISTING DATA
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
