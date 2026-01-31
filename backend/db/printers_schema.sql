-- Printer Management Schema

-- 1. PRINTERS TABLE
CREATE TABLE IF NOT EXISTS public.printers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id),
    name TEXT NOT NULL, -- Ej: 'Cocina Caliente', 'Barra', 'Ticket Caja'
    connection_type TEXT DEFAULT 'network', -- 'network' (IP), 'usb', 'bluetooth'
    ip_address TEXT, -- Ej: '192.168.1.100'
    port INTEGER DEFAULT 9100, -- Puerto estándar ESC/POS
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. UPDATE CATEGORIES TO LINK TO PRINTERS
-- Remove old text column and add foreign key
ALTER TABLE public.categories DROP COLUMN IF EXISTS printer_destination;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id);

-- 3. ENABLE RLS
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on printers" ON public.printers FOR ALL TO authenticated USING (true);
