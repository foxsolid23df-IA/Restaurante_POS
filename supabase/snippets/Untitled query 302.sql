-- Crear usuario en auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated',
  'admin@restaurante.com',
  crypt('admin123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{}', FALSE
);

-- Crear perfil asociado
INSERT INTO public.profiles (id, full_name, role, pin_code, is_active)
SELECT id, 'Administrador', 'admin'::user_role, '1111', true
FROM auth.users WHERE email = 'admin@restaurante.com';