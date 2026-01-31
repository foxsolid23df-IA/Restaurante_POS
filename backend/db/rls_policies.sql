-- Políticas RLS para inventory_items
-- Permitir a usuarios autenticados leer todos los items
CREATE POLICY "Allow authenticated users to read inventory_items"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios autenticados insertar items
CREATE POLICY "Allow authenticated users to insert inventory_items"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir a usuarios autenticados actualizar items
CREATE POLICY "Allow authenticated users to update inventory_items"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir a usuarios autenticados eliminar items
CREATE POLICY "Allow authenticated users to delete inventory_items"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para categories
CREATE POLICY "Allow authenticated users to read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin and manager users to insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

CREATE POLICY "Allow admin and manager users to update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

CREATE POLICY "Allow admin and manager users to delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);

-- Políticas RLS para products
CREATE POLICY "Allow authenticated users to read products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para product_recipes
CREATE POLICY "Allow authenticated users to read product_recipes"
ON public.product_recipes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert product_recipes"
ON public.product_recipes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product_recipes"
ON public.product_recipes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete product_recipes"
ON public.product_recipes
FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para profiles
CREATE POLICY "Allow users to read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow anonymous users to read profiles for PIN login"
ON public.profiles
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow users to update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Políticas RLS para areas
CREATE POLICY "Allow authenticated users to read areas"
ON public.areas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert areas"
ON public.areas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update areas"
ON public.areas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete areas"
ON public.areas
FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para tables
CREATE POLICY "Allow authenticated users to read tables"
ON public.tables
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert tables"
ON public.tables
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tables"
ON public.tables
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete tables"
ON public.tables
FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para orders
CREATE POLICY "Allow authenticated users to read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (true);

-- Políticas RLS para order_items
CREATE POLICY "Allow authenticated users to read order_items"
ON public.order_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert order_items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update order_items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete order_items"
ON public.order_items
FOR DELETE
TO authenticated
USING (true);
