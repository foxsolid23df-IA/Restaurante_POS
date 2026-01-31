-- Políticas RLS temporales para categories - EJECUTAR ESTO EN SUPABASE SQL EDITOR

-- Permitir INSERT a todos los usuarios autenticados (temporal)
CREATE POLICY "Allow authenticated users to insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE a todos los usuarios autenticados (temporal)  
CREATE POLICY "Allow authenticated users to update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir DELETE a todos los usuarios autenticados (temporal)
CREATE POLICY "Allow authenticated users to delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (true);

-- Nota: Estas políticas son temporales. Para producción, usa las políticas
-- más restrictivas que verifican el rol del usuario en rls_policies.sql