-- Seed: Create admin user with PIN 1111 for local development
-- Extension pgcrypto should already be installed

DO $$
DECLARE
  user_id UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (all nullable string columns set to '' for GoTrue compatibility)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current,
    email_change, phone_change, phone_change_token,
    reauthentication_token,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'admin@restaurante.com',
    extensions.crypt('admin123', extensions.gen_salt('bf')),
    NOW(),
    '', '', '', '', '', '', '',
    '',
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    '{}'::jsonb,
    NOW(),
    NOW()
  );

  -- Insert profile with PIN 1111 (plaintext, pin_code_hash is NULL so verify_pin fallback works)
  INSERT INTO public.profiles (id, full_name, role, pin_code, is_active, email, permissions, preferred_language)
  VALUES (
    user_id,
    'Admin',
    'admin',
    '1111',
    TRUE,
    'admin@restaurante.com',
    jsonb_build_object(
      'access_admin', true,
      'access_pos', true,
      'view_reports', true,
      'manage_inventory', true,
      'manage_staff', true,
      'modify_prices', true,
      'delete_orders', true
    ),
    'es'
  );

  -- Insert default branch
  INSERT INTO public.branches (id, name, code, timezone, is_active, is_main_office)
  VALUES (gen_random_uuid(), 'Sucursal Principal', 'PRIN', 'America/Mexico_City', TRUE, TRUE)
  ON CONFLICT DO NOTHING;

  -- Assign all profiles to the default branch
  UPDATE public.profiles
  SET branch_id = (SELECT id FROM public.branches WHERE is_main_office = TRUE LIMIT 1)
  WHERE branch_id IS NULL;
END $$;
