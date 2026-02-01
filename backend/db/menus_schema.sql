-- Crear tabla de Menús (Desayunos, Comidas, Cenas)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    active_days JSONB DEFAULT '[1,2,3,4,5,6,0]', -- 0=Domingo, 1=Lunes, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vincular Categorías a Menús
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Política básica para permitir todo a usuarios autenticados
DO \$\$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'menus' AND policyname = 'Full access to menus for all authenticated users'
    ) THEN
        CREATE POLICY \
Full
access
to
menus
for
all
authenticated
users\
        ON public.menus
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END \$\$;
