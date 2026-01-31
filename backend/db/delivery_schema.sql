-- Enable PostGIS extension for geographical coordinates
CREATE EXTENSION IF NOT EXISTS postgis;

-- DELIVERY_ORDERS
CREATE TABLE IF NOT EXISTS public.delivery_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    delivery_status TEXT DEFAULT 'pending', -- pending, preparing, ready, out_for_delivery, delivered, cancelled
    delivery_address TEXT NOT NULL,
    delivery_location geography(POINT), -- For GPS coordinates
    delivery_phone TEXT,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    external_platform TEXT, -- 'UberEats', 'DidiFood', 'Rappi', 'Direct'
    external_order_id TEXT,
    tracking_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DRIVER_LOCATIONS (for real-time tracking)
CREATE TABLE IF NOT EXISTS public.driver_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    location geography(POINT) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Enable all for authenticated users on delivery_orders" ON public.delivery_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users on driver_locations" ON public.driver_locations FOR ALL TO authenticated USING (true);
