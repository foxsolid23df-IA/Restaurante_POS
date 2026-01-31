-- CRM, Reservations and Loyalty Schema

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    loyalty_points INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RESERVATIONS
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    reservation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pax INTEGER DEFAULT 2,
    status TEXT DEFAULT 'pending', -- pending, confirmed, seated, cancelled, noshow
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LOYALTY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- earn, redeem, adjust
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Enable all for authenticated users on customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on reservations" ON public.reservations FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on loyalty_transactions" ON public.loyalty_transactions FOR ALL TO authenticated USING (true);

-- Initial Data
INSERT INTO public.customers (name, email, phone, loyalty_points)
VALUES 
('Juan Pérez', 'juan@example.com', '555-0101', 150),
('María García', 'maria@example.com', '555-0102', 250),
('Luis Rodriguez', 'luis@example.com', '555-0103', 50);
