-- Tabla para pedidos de clientes desde menu QR / app movil
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'qr_menu' CHECK (source IN ('qr_menu', 'mobile_app', 'web')),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_customer_orders_table_id ON public.customer_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON public.customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON public.customer_orders(created_at DESC);

-- RLS: permitir inserts anonimos (clientes) pero solo lectura para staff autenticado
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert customer orders"
  ON public.customer_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read customer orders"
  ON public.customer_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update customer orders"
  ON public.customer_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_customer_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_orders_timestamp
  BEFORE UPDATE ON public.customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_orders_timestamp();
