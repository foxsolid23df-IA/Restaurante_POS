-- Esquema para Cortes de Caja y Cierres de Día
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tipo ENUM para métodos de pago
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'digital_wallet');

-- 2. Tabla de pagos individuales
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE NULL, -- Quien procesó el pago
    payment_method payment_method NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    cash_received NUMERIC(10, 2), -- Solo para efectivo
    change_given NUMERIC(10, 2) DEFAULT 0, -- Solo para efectivo
    card_last_four TEXT, -- Últimos 4 dígitos de tarjeta
    auth_code TEXT, -- Código de autorización de tarjeta
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de cortes de caja por usuario/turno
CREATE TABLE IF NOT EXISTS public.cash_closings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE NULL,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_cash NUMERIC(10, 2) DEFAULT 0,
    total_cash_sales NUMERIC(10, 2) DEFAULT 0,
    total_card_sales NUMERIC(10, 2) DEFAULT 0,
    total_other_sales NUMERIC(10, 2) DEFAULT 0,
    expected_cash NUMERIC(10, 2) DEFAULT 0, -- initial_cash + total_cash_sales
    actual_cash NUMERIC(10, 2), -- Efectivo real en caja
    difference NUMERIC(10, 2), -- Diferencia (actual - expected)
    status TEXT DEFAULT 'open', -- open, closed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabla de cierres de día (resumen diario)
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    closing_date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_sales NUMERIC(10, 2) DEFAULT 0,
    cash_sales NUMERIC(10, 2) DEFAULT 0,
    card_sales NUMERIC(10, 2) DEFAULT 0,
    other_sales NUMERIC(10, 2) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    average_ticket NUMERIC(10, 2) DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Modificar tabla orders para incluir información de pago
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_user_id UUID REFERENCES public.profiles(id) ON DELETE NULL,
ADD COLUMN IF NOT EXISTS payment_method payment_method,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10, 2) DEFAULT 0;

-- 6. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_closings_user_id ON public.cash_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_status ON public.cash_closings(status);
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON public.daily_closings(closing_date);

-- 7. Habilitar RLS en nuevas tablas
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para payments
CREATE POLICY "Allow authenticated users to read payments"
ON public.payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update own payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Políticas RLS para cash_closings
CREATE POLICY "Allow users to read own cash closings"
ON public.cash_closings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow managers to read all cash closings"
ON public.cash_closings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Allow users to insert own cash closings"
ON public.cash_closings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own cash closings"
ON public.cash_closings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow managers to update all cash closings"
ON public.cash_closings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

-- 10. Políticas RLS para daily_closings
CREATE POLICY "Allow authenticated users to read daily closings"
ON public.daily_closings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin and manager to create daily closings"
ON public.daily_closings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);