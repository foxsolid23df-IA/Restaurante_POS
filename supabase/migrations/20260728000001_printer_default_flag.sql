-- Agrega campo is_default a printers para definir impresora de ticket por defecto
-- y actualiza save_printer_config para mantener un unico default por sucursal.

ALTER TABLE public.printers
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_printers_branch_default
ON public.printers(branch_id, is_default)
WHERE is_default = TRUE;

CREATE OR REPLACE FUNCTION public.save_printer_config(p_printer JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  printer_record public.printers%ROWTYPE;
  old_record public.printers%ROWTYPE;
  printer_id UUID := NULLIF(p_printer->>'id', '')::UUID;
  target_branch_id UUID := NULLIF(p_printer->>'branch_id', '')::UUID;
  make_default BOOLEAN := COALESCE(NULLIF(p_printer->>'is_default', '')::BOOLEAN, FALSE);
BEGIN
  IF NOT public.user_can_manage_settings() THEN
    RAISE EXCEPTION 'permission denied for printer configuration';
  END IF;

  IF NULLIF(trim(COALESCE(p_printer->>'name', '')), '') IS NULL THEN
    RAISE EXCEPTION 'printer name is required';
  END IF;

  IF target_branch_id IS NULL THEN
    RAISE EXCEPTION 'branch is required for printer configuration';
  END IF;

  IF printer_id IS NULL THEN
    INSERT INTO public.printers(name, branch_id, connection_type, ip_address, port, is_active, is_default, updated_at)
    VALUES (
      trim(p_printer->>'name'),
      target_branch_id,
      COALESCE(NULLIF(p_printer->>'connection_type', ''), 'network'),
      NULLIF(trim(COALESCE(p_printer->>'ip_address', '')), ''),
      COALESCE(NULLIF(p_printer->>'port', '')::INTEGER, 9100),
      TRUE,
      make_default,
      timezone('utc'::TEXT, now())
    )
    RETURNING * INTO printer_record;

    INSERT INTO public.settings_audit_log(setting_scope, setting_key, old_value, new_value, changed_by)
    VALUES ('printers', 'create', NULL, to_jsonb(printer_record), auth.uid());
  ELSE
    SELECT * INTO old_record
    FROM public.printers
    WHERE id = printer_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'printer not found';
    END IF;

    UPDATE public.printers
    SET name = trim(p_printer->>'name'),
        branch_id = target_branch_id,
        connection_type = COALESCE(NULLIF(p_printer->>'connection_type', ''), connection_type, 'network'),
        ip_address = NULLIF(trim(COALESCE(p_printer->>'ip_address', '')), ''),
        port = COALESCE(NULLIF(p_printer->>'port', '')::INTEGER, port, 9100),
        is_active = COALESCE(NULLIF(p_printer->>'is_active', '')::BOOLEAN, is_active, TRUE),
        is_default = COALESCE(NULLIF(p_printer->>'is_default', '')::BOOLEAN, is_default, FALSE),
        updated_at = timezone('utc'::TEXT, now())
    WHERE id = printer_id
    RETURNING * INTO printer_record;

    INSERT INTO public.settings_audit_log(setting_scope, setting_key, old_value, new_value, changed_by)
    VALUES ('printers', 'update', to_jsonb(old_record), to_jsonb(printer_record), auth.uid());
  END IF;

  -- Solo una impresora default por sucursal
  IF make_default THEN
    UPDATE public.printers
    SET is_default = FALSE,
        updated_at = timezone('utc'::TEXT, now())
    WHERE branch_id = target_branch_id
      AND id <> printer_record.id
      AND is_default = TRUE;
  END IF;

  RETURN to_jsonb(printer_record);
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.printers TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_printer_config(JSONB) TO authenticated;
