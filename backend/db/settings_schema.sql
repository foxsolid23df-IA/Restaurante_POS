-- Business Settings and Tax Configuration

CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Mi Restaurante',
    rfc TEXT, -- Mexico Tax ID
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'MXN',
    tax_rate NUMERIC(10, 4) DEFAULT 0.16, -- Default 16% IVA
    tax_name TEXT DEFAULT 'IVA',
    ticket_header TEXT,
    ticket_footer TEXT DEFAULT '¡Gracias por su visita!',
    is_electronic_invoicing_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings if not exists
INSERT INTO public.business_settings (id, name)
VALUES (uuid_generate_v4(), 'Restaurante POS Pro')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read for all authenticated users" ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update for admins only" ON public.business_settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
