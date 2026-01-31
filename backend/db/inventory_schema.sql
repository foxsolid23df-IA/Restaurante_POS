-- Inventory Management Schema (Logs and Alerts)

-- INVENTORY_LOG (Tracks stock movements)
CREATE TABLE IF NOT EXISTS public.inventory_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    old_stock NUMERIC(10, 4) NOT NULL,
    new_stock NUMERIC(10, 4) NOT NULL,
    quantity_used NUMERIC(10, 4) NOT NULL, -- negative if added
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INVENTORY_ALERTS (Real-time notifications for low stock)
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    current_stock NUMERIC(10, 4) NOT NULL,
    min_stock NUMERIC(10, 4) NOT NULL,
    unit TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'critical'
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Enable all for authenticated users on inventory_log" ON public.inventory_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on inventory_alerts" ON public.inventory_alerts FOR ALL TO authenticated USING (true);
