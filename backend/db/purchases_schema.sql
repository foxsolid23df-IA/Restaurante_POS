-- Purchases and Suppliers Management Schema

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT, -- RFC in Mexico
    category TEXT, -- Food, Beverage, Maintenance, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PURCHASES (Invoices/Expenses)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invoice_number TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'completed', -- pending, completed, canceled
    payment_method TEXT DEFAULT 'cash', -- cash, credit, transfer
    payment_status TEXT DEFAULT 'paid', -- pending, paid
    notes TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PURCHASE ITEMS (Details of what was bought)
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 4) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Enable all for authenticated users on suppliers" ON public.suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on purchases" ON public.purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on purchase_items" ON public.purchase_items FOR ALL TO authenticated USING (true);
