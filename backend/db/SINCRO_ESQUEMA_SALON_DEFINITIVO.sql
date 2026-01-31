-- MEGA FIX: Sincronización de Esquema para Arquitectura de Salón y Multi-Sucursal
-- Este script añade todas las columnas faltantes necesarias para que el frontend funcione.

-- 1. CORRECCIONES PARA LA TABLA 'areas'
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#064e3b';
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 2. CORRECCIONES PARA LA TABLA 'tables'
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'rounded';
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS x_pos NUMERIC(10, 2) DEFAULT 20.00;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS y_pos NUMERIC(10, 2) DEFAULT 20.00;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 3. CORRECCIONES PARA LA TABLA 'profiles' (Solo por si acaso)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- 4. ACTUALIZACIÓN DE DATOS INICIALES (Si existen)
UPDATE public.areas SET color = '#064e3b' WHERE color IS NULL;
UPDATE public.tables SET shape = 'rounded' WHERE shape IS NULL;
UPDATE public.tables SET x_pos = 20.00 WHERE x_pos IS NULL;
UPDATE public.tables SET y_pos = 20.00 WHERE y_pos IS NULL;

-- 5. ASEGURAR POLÍTICAS RLS (Para evitar errores de permisos)
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a autenticados en areas" ON public.areas;
CREATE POLICY "Permitir todo a autenticados en areas" ON public.areas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a autenticados en tables" ON public.tables;
CREATE POLICY "Permitir todo a autenticados en tables" ON public.tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
