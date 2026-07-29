-- Agrega soporte para pedidos sin mesa (para llevar) y campos de cliente en orders
-- order_type: dine_in | takeaway | delivery
-- customer_info: JSONB para nombre, telefono y nota del cliente sin registro

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'dine_in';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_info JSONB;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Restringir valores permitidos
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_order_type_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_order_type_check
CHECK (order_type IN ('dine_in', 'takeaway', 'delivery'));

-- Index util para filtrar pedidos para llevar
CREATE INDEX IF NOT EXISTS idx_orders_order_type
ON public.orders(order_type);

-- Actualizar la funcion de salon para que solo cuente mesas ocupadas por dine_in
-- (los pedidos takeaway no tienen mesa, pero por si acaso se filtra)
CREATE OR REPLACE FUNCTION public.get_salon_layout(p_branch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF p_branch_id IS NULL THEN
    RETURN jsonb_build_object('areas', '[]'::JSONB, 'tables', '[]'::JSONB, 'metrics', jsonb_build_object());
  END IF;

  SELECT jsonb_build_object(
    'areas', COALESCE((
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a.sort_order, a.name)
      FROM public.areas a
      WHERE a.branch_id = p_branch_id
        AND COALESCE(a.is_active, TRUE)
    ), '[]'::JSONB),
    'tables', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'branch_id', t.branch_id,
          'area_id', t.area_id,
          'name', t.name,
          'capacity', t.capacity,
          'status', t.status,
          'shape', t.shape,
          'x_pos', t.x_pos,
          'y_pos', t.y_pos,
          'rotation', t.rotation,
          'sort_order', t.sort_order,
          'is_active', t.is_active,
          'created_at', t.created_at,
          'updated_at', t.updated_at,
          'areas', CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id', a.id, 'name', a.name, 'color', a.color) END,
          'current_order', (
            SELECT jsonb_build_object(
              'id', o.id,
              'status', o.status,
              'created_at', o.created_at,
              'total_amount', o.total_amount,
              'user_id', o.user_id,
              'user_name', p.full_name
            )
            FROM public.orders o
            LEFT JOIN public.profiles p ON p.id = o.user_id
            WHERE o.table_id = t.id
              AND COALESCE(o.order_type, 'dine_in') = 'dine_in'
              AND o.status IN ('pending', 'confirmed', 'preparing', 'ready', 'active')
            ORDER BY o.created_at DESC
            LIMIT 1
          ),
          'next_reservation', (
            SELECT jsonb_build_object(
              'id', r.id,
              'reservation_date', r.reservation_date,
              'duration_minutes', r.duration_minutes,
              'pax', r.pax,
              'status', r.status,
              'customer_name', c.name
            )
            FROM public.reservations r
            LEFT JOIN public.customers c ON c.id = r.customer_id
            WHERE r.table_id = t.id
              AND r.status IN ('pending', 'confirmed')
              AND r.reservation_date >= timezone('utc'::TEXT, now())
            ORDER BY r.reservation_date ASC
            LIMIT 1
          )
        )
        ORDER BY t.sort_order, t.name
      )
      FROM public.tables t
      LEFT JOIN public.areas a ON a.id = t.area_id
      WHERE t.branch_id = p_branch_id
        AND COALESCE(t.is_active, TRUE)
    ), '[]'::JSONB),
    'metrics', COALESCE((
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'available', COUNT(*) FILTER (WHERE status = 'available'),
        'occupied', COUNT(*) FILTER (WHERE status = 'occupied'),
        'reserved', COUNT(*) FILTER (WHERE status = 'reserved'),
        'maintenance', COUNT(*) FILTER (WHERE status = 'maintenance'),
        'totalCapacity', COALESCE(SUM(capacity), 0),
        'occupiedCapacity', COALESCE(SUM(capacity) FILTER (WHERE status = 'occupied'), 0)
      )
      FROM public.tables t
      WHERE t.branch_id = p_branch_id
        AND COALESCE(t.is_active, TRUE)
    ), jsonb_build_object())
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_salon_layout(UUID) TO authenticated;

-- Asegurar que la tabla orders tenga las columnas necesarias para el flujo actual
DO $$
BEGIN
  -- customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;

  -- branch_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  -- payment_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  -- payment_method
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
  END IF;

  -- payment_amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_amount NUMERIC(10, 2);
  END IF;

  -- change_amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'change_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN change_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;

  -- payment_user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_user_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN';
  END IF;

  -- customer_language
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_language'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_language TEXT DEFAULT 'es';
  END IF;
END $$;
