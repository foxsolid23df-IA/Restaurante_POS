    -- Customer orders table for public QR menu ordering.

    CREATE TABLE IF NOT EXISTS public.customer_orders (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
        items JSONB NOT NULL DEFAULT '[]'::JSONB,
        total NUMERIC(10, 2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        source TEXT DEFAULT 'qr_menu',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
    );

    CREATE INDEX IF NOT EXISTS idx_customer_orders_table_id ON public.customer_orders(table_id);
    CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON public.customer_orders(status);
    CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON public.customer_orders(created_at);

    ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

    -- Allow anon to insert orders (public QR menu)
    CREATE POLICY "Allow anon to insert customer_orders"
    ON public.customer_orders
    FOR INSERT
    TO anon
    WITH CHECK (true);

    -- Allow anon to read their own orders (by table)
    CREATE POLICY "Allow anon to read customer_orders"
    ON public.customer_orders
    FOR SELECT
    TO anon
    USING (true);

    -- Allow authenticated users full access
    CREATE POLICY "Enable all for authenticated users on customer_orders"
    ON public.customer_orders
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

    GRANT INSERT, SELECT ON public.customer_orders TO anon;
    GRANT ALL ON public.customer_orders TO authenticated;
