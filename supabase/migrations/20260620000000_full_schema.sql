-- Comprehensive initial schema for Restaurante POS
-- Combines all schema files into a single idempotent migration

-- =============================================================
-- Extensions
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- ENUM types
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'captain', 'waiter', 'cashier');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'digital_wallet');
  END IF;
END $$;

-- =============================================================
-- Core tables (initial_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'waiter',
    pin_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC(10, 4) DEFAULT 0,
    min_stock NUMERIC(10, 4) DEFAULT 0,
    cost_per_unit NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    printer_destination TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity_required NUMERIC(10, 4) NOT NULL,
    UNIQUE(product_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    price_at_order NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Branches table (multi_branch_schema.sql / branches MVP)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
    opening_hours JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_main_office BOOLEAN NOT NULL DEFAULT FALSE,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- =============================================================
-- Payments schema (payments_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payment_method payment_method NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    cash_received NUMERIC(10, 2),
    change_given NUMERIC(10, 2) DEFAULT 0,
    card_last_four TEXT,
    auth_code TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cash_closings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_cash NUMERIC(10, 2) DEFAULT 0,
    total_cash_sales NUMERIC(10, 2) DEFAULT 0,
    total_card_sales NUMERIC(10, 2) DEFAULT 0,
    total_other_sales NUMERIC(10, 2) DEFAULT 0,
    expected_cash NUMERIC(10, 2) DEFAULT 0,
    actual_cash NUMERIC(10, 2),
    difference NUMERIC(10, 2),
    status TEXT DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

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
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- CRM schema (crm_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    loyalty_points INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    reservation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pax INTEGER DEFAULT 2,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Delivery schema (delivery_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.delivery_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    delivery_status TEXT DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    delivery_phone TEXT,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    external_platform TEXT,
    external_order_id TEXT,
    tracking_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.driver_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Settings schema (settings_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Mi Restaurante',
    rfc TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'MXN',
    tax_rate NUMERIC(10, 4) DEFAULT 0.16,
    tax_name TEXT DEFAULT 'IVA',
    ticket_header TEXT,
    ticket_footer TEXT DEFAULT 'Gracias por su visita!',
    is_electronic_invoicing_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.business_settings (id, name)
VALUES (uuid_generate_v4(), 'Restaurante POS Pro')
ON CONFLICT DO NOTHING;

-- =============================================================
-- Purchases schema (purchases_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invoice_number TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'completed',
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    notes TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 4) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Inventory schema (inventory_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.inventory_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    old_stock NUMERIC(10, 4) NOT NULL,
    new_stock NUMERIC(10, 4) NOT NULL,
    quantity_used NUMERIC(10, 4) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- =============================================================
-- Inventory transfers (multi_branch_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_branch_id UUID REFERENCES public.branches(id) NOT NULL,
    to_branch_id UUID REFERENCES public.branches(id) NOT NULL,
    requested_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transfer_id UUID REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
    inventory_item_id UUID,
    quantity NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Menus schema (menus_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.menus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    active_days JSONB DEFAULT '[1,2,3,4,5,6,0]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Printers schema (printers_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.printers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id),
    name TEXT NOT NULL,
    connection_type TEXT DEFAULT 'network',
    ip_address TEXT,
    port INTEGER DEFAULT 9100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================
-- Phase 5 — Integraciones y Hardware (phase5_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  xml TEXT NOT NULL,
  uuid UUID,
  serie TEXT,
  folio INTEGER,
  subtotal NUMERIC(12,2),
  total NUMERIC(12,2),
  currency TEXT DEFAULT 'MXN',
  receiver_rfc TEXT,
  emitter_rfc TEXT,
  status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stamped_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fiscal_printer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  printer_type TEXT NOT NULL DEFAULT 'none',
  connection TEXT,
  host TEXT,
  port INTEGER,
  com_port TEXT,
  vendor_id INTEGER,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id)
);

-- =============================================================
-- Phase 6 — Inteligencia y Analytics (phase6_schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'discount',
  active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  delivery_method TEXT NOT NULL DEFAULT 'email',
  time TIME NOT NULL DEFAULT '06:00',
  day_of_week INTEGER DEFAULT 1,
  day_of_month INTEGER DEFAULT 1,
  email TEXT,
  phone TEXT,
  params JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  method TEXT NOT NULL DEFAULT 'email',
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- =============================================================
-- ALTER TABLE statements (add columns to existing tables)
-- =============================================================

-- Staff/roles MVP columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pin_code_hash TEXT;

-- Salon architecture columns
ALTER TABLE public.areas
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

ALTER TABLE public.tables
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS x_pos NUMERIC(10, 2) NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS y_pos NUMERIC(10, 2) NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS rotation INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now());

-- Inventory MVP columns
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Orders payment columns (payments_schema.sql)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method payment_method,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10, 2) DEFAULT 0;

-- Orders branch_id (multi_branch_schema.sql)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Orders currency (branch_currency_schema.sql)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';

-- Phase 5 orders columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_updated_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_expected NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_received NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_due NUMERIC(12,2);

-- Payment gateway config
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS payment_gateway_config JSONB;

-- Suppliers branch_id
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Categories menu_id (menus_schema.sql)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL;

-- Categories -> printers (printers_schema.sql)
ALTER TABLE public.categories DROP COLUMN IF EXISTS printer_destination;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id);

-- Branch currency
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';

-- Products columns (catalog MVP)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Product_recipes wastage_percentage (reports RPC)
ALTER TABLE public.product_recipes
ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(5, 2) DEFAULT 0;

-- Phase 7 — Multi-idioma columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_language TEXT DEFAULT 'es';

-- preferred_language for staff — added to profiles (staff is a view)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'es';

-- =============================================================
-- Staff view for RLS compatibility
-- The codebase uses `profiles` as staff table, but phase schemas
-- reference `staff` in RLS policies. Create a view for compatibility.
-- =============================================================

CREATE OR REPLACE VIEW staff AS
  SELECT id AS user_id, id, full_name, role, email, branch_id, is_active, permissions, preferred_language
  FROM public.profiles;

-- =============================================================
-- Indexes
-- =============================================================

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_closings_user_id ON public.cash_closings(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_status ON public.cash_closings(status);
CREATE INDEX IF NOT EXISTS idx_daily_closings_date ON public.daily_closings(closing_date);
CREATE INDEX IF NOT EXISTS idx_reports_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reports_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_orders_branch_created ON public.orders(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_orders_status_created ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reports_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_product_recipes_product_id ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_product_recipes_inventory_item_id ON public.product_recipes(inventory_item_id);

-- Branches
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches(is_active);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON public.inventory_log(inventory_item_id);

-- Phase 6
CREATE INDEX IF NOT EXISTS idx_business_rules_branch ON business_rules(branch_id, active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_branch ON inventory_alerts(branch_id, resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_severity ON inventory_alerts(severity) WHERE resolved = false;

-- Production optimization
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_table_created ON orders(table_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tables_area_status ON tables(area_id, status);

-- =============================================================
-- RPC Functions (from phase5_schema.sql)
-- =============================================================

CREATE OR REPLACE FUNCTION create_paypal_order(
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'MXN',
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', gen_random_uuid()::TEXT,
    'status', 'CREATED',
    'amount', p_amount,
    'currency', p_currency,
    'metadata', p_metadata
  );
END;
$$;

CREATE OR REPLACE FUNCTION capture_paypal_order(
  p_order_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'id', p_order_id,
    'status', 'COMPLETED',
    'capture_id', gen_random_uuid()::TEXT
  );
END;
$$;

CREATE OR REPLACE FUNCTION refund_paypal_payment(
  p_capture_id TEXT,
  p_amount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'capture_id', p_capture_id,
    'status', 'COMPLETED',
    'amount', p_amount
  );
END;
$$;

-- =============================================================
-- RLS: Enable row level security on all tables
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_printer_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- RLS Policies (permissive for local development)
-- =============================================================

-- Profiles
CREATE POLICY "Enable all for authenticated users on profiles"
  ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Areas
CREATE POLICY "Enable all for authenticated users on areas"
  ON public.areas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tables
CREATE POLICY "Enable all for authenticated users on tables"
  ON public.tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory items
CREATE POLICY "Enable all for authenticated users on inventory_items"
  ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Categories
CREATE POLICY "Enable all for authenticated users on categories"
  ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products
CREATE POLICY "Enable all for authenticated users on products"
  ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product recipes
CREATE POLICY "Enable all for authenticated users on product_recipes"
  ON public.product_recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
CREATE POLICY "Enable all for authenticated users on orders"
  ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order items
CREATE POLICY "Enable all for authenticated users on order_items"
  ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "Enable all for authenticated users on payments"
  ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Cash closings
CREATE POLICY "Enable all for authenticated users on cash_closings"
  ON public.cash_closings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Daily closings
CREATE POLICY "Enable all for authenticated users on daily_closings"
  ON public.daily_closings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers
CREATE POLICY "Enable all for authenticated users on customers"
  ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reservations
CREATE POLICY "Enable all for authenticated users on reservations"
  ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Loyalty transactions
CREATE POLICY "Enable all for authenticated users on loyalty_transactions"
  ON public.loyalty_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Delivery orders
CREATE POLICY "Enable all for authenticated users on delivery_orders"
  ON public.delivery_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Driver locations
CREATE POLICY "Enable all for authenticated users on driver_locations"
  ON public.driver_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Business settings
CREATE POLICY "Enable read for all authenticated users on business_settings"
  ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update for admins only on business_settings"
  ON public.business_settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Suppliers
CREATE POLICY "Enable all for authenticated users on suppliers"
  ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchases
CREATE POLICY "Enable all for authenticated users on purchases"
  ON public.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase items
CREATE POLICY "Enable all for authenticated users on purchase_items"
  ON public.purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory log
CREATE POLICY "Enable all for authenticated users on inventory_log"
  ON public.inventory_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory alerts
CREATE POLICY "Enable all for authenticated users on inventory_alerts"
  ON public.inventory_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory transfers
CREATE POLICY "Enable all for authenticated users on inventory_transfers"
  ON public.inventory_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory transfer items
CREATE POLICY "Enable all for authenticated users on inventory_transfer_items"
  ON public.inventory_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Menus
CREATE POLICY "Enable all for authenticated users on menus"
  ON public.menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Printers
CREATE POLICY "Enable all for authenticated users on printers"
  ON public.printers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Webhook logs
CREATE POLICY "Staff can view webhook logs" ON webhook_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert webhook logs" ON webhook_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Invoices
CREATE POLICY "Staff can view invoices" ON invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert invoices" ON invoices
  FOR INSERT TO authenticated WITH CHECK (true);

-- Fiscal printer config
CREATE POLICY "Staff can manage fiscal printer config" ON fiscal_printer_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Business rules
CREATE POLICY "Staff can manage business rules" ON business_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Scheduled reports
CREATE POLICY "Staff can manage scheduled reports" ON scheduled_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notification queue
CREATE POLICY "Staff can view notification queue" ON notification_queue
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert notifications" ON notification_queue
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================
-- Grant permissions
-- =============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
