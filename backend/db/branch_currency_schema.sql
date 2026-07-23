-- Agregar moneda por sucursal
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';

-- Actualizar branch_payload para incluir moneda (para las RPC)
CREATE OR REPLACE FUNCTION public.update_branch_currency(
  p_branch_id UUID,
  p_currency TEXT
) RETURNS public.branches AS $$
DECLARE
  v_branch public.branches;
BEGIN
  UPDATE public.branches
  SET currency = p_currency, updated_at = NOW()
  WHERE id = p_branch_id
  RETURNING * INTO v_branch;

  RETURN v_branch;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para propagar moneda de sucursal a nuevas órdenes
CREATE OR REPLACE FUNCTION public.set_order_currency()
RETURNS TRIGGER AS $$
DECLARE
  v_currency TEXT;
BEGIN
  SELECT currency INTO v_currency FROM public.branches WHERE id = NEW.branch_id;
  NEW.currency := COALESCE(v_currency, 'MXN');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_currency ON public.orders;
CREATE TRIGGER trg_set_order_currency
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_currency();

-- Agregar columna currency a orders si no existe
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';
