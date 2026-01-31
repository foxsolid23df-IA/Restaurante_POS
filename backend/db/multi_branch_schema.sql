-- Multi-Branch Management System (Final refined version)

-- 1. BRANCHES TABLE
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

-- 2. ADD BRANCH_ID TO CORE TABLES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.inventory_alerts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 3. INVENTORY TRANSFERS
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_branch_id UUID REFERENCES public.branches(id) NOT NULL,
    to_branch_id UUID REFERENCES public.branches(id) NOT NULL,
    requested_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending', -- pending, sent, received, rejected
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transfer_id UUID REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
    inventory_item_id UUID, -- Reference to item in the SOURCE branch (from_branch_id)
    quantity NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Initial Seed Logic (Run manually or via agent if possible)
-- DO NOT FORGET: After creating the first branch, update all NULL branch_id to this branch.

-- Example:
-- INSERT INTO branches (name, is_main_office) VALUES ('Sucursal Principal', true);
-- UPDATE profiles SET branch_id = (SELECT id FROM branches LIMIT 1) WHERE branch_id IS NULL;
-- UPDATE areas SET branch_id = (SELECT id FROM branches LIMIT 1) WHERE branch_id IS NULL;
-- ... etc
