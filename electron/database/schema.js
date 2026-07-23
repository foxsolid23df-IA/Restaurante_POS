export function initializeSchema(db) {
  // Branches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
      opening_hours TEXT DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_main_office INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'MXN',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // Profiles/Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'waiter',
      pin_code TEXT,
      is_active INTEGER DEFAULT 1,
      email TEXT,
      permissions TEXT DEFAULT '{}',
      branch_id TEXT,
      preferred_language TEXT DEFAULT 'es',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Areas/Salon zones
  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      branch_id TEXT,
      description TEXT,
      color TEXT DEFAULT '#2563eb',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      area_id TEXT,
      name TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      status TEXT DEFAULT 'available',
      branch_id TEXT,
      shape TEXT NOT NULL DEFAULT 'rounded',
      x_pos REAL NOT NULL DEFAULT 20,
      y_pos REAL NOT NULL DEFAULT 20,
      rotation INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Menus
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      name TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      active_days TEXT DEFAULT '[0,1,2,3,4,5,6]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      menu_id TEXT,
      printer_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
    )
  `)

  // Products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      description TEXT,
      sku TEXT,
      barcode TEXT,
      branch_id TEXT,
      preparation_time INTEGER DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Product Recipes
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_recipes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      inventory_item_id TEXT NOT NULL,
      quantity_required REAL NOT NULL,
      wastage_percentage REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
    )
  `)

  // Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      table_id TEXT,
      user_id TEXT,
      customer_id TEXT,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      closed_at TEXT,
      payment_user_id TEXT,
      payment_method TEXT,
      payment_amount REAL,
      change_amount REAL DEFAULT 0,
      branch_id TEXT,
      currency TEXT NOT NULL DEFAULT 'MXN',
      customer_language TEXT DEFAULT 'es',
      _synced INTEGER DEFAULT 0,
      _local_id TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Order Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      price_at_order REAL NOT NULL,
      created_at TEXT NOT NULL,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `)

  // Payments
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      cash_received REAL,
      change_given REAL DEFAULT 0,
      card_last_four TEXT,
      auth_code TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Customers
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      avatar_url TEXT,
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      visit_count INTEGER NOT NULL DEFAULT 0,
      last_visit_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      metadata TEXT DEFAULT '{}',
      created_by TEXT,
      preferred_language TEXT DEFAULT 'es',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Reservations
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      customer_id TEXT,
      table_id TEXT,
      reservation_date TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 120,
      pax INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Loyalty Rewards
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL DEFAULT 100,
      icon_name TEXT DEFAULT 'Gift',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Loyalty Transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      balance_before INTEGER NOT NULL DEFAULT 0,
      balance_after INTEGER NOT NULL DEFAULT 0,
      transaction_type TEXT NOT NULL,
      order_id TEXT,
      reward_id TEXT,
      description TEXT,
      is_suspicious INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (reward_id) REFERENCES loyalty_rewards(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Inventory Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      cost_per_unit REAL,
      branch_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      category TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Inventory Alerts
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_alerts (
      id TEXT PRIMARY KEY,
      inventory_item_id TEXT NOT NULL,
      branch_id TEXT,
      item_name TEXT NOT NULL,
      current_stock REAL NOT NULL,
      min_stock REAL NOT NULL,
      unit TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'low',
      resolved INTEGER NOT NULL DEFAULT 0,
      resolved_at TEXT,
      resolved_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Cash Closings
  db.exec(`
    CREATE TABLE IF NOT EXISTS cash_closings (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      shift_start TEXT NOT NULL,
      shift_end TEXT NOT NULL,
      initial_cash REAL DEFAULT 0,
      total_cash_sales REAL DEFAULT 0,
      total_card_sales REAL DEFAULT 0,
      total_other_sales REAL DEFAULT 0,
      expected_cash REAL DEFAULT 0,
      actual_cash REAL,
      difference REAL,
      status TEXT DEFAULT 'open',
      notes TEXT,
      created_at TEXT NOT NULL,
      closed_at TEXT,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Daily Closings
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_closings (
      id TEXT PRIMARY KEY,
      closing_date TEXT NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_sales REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      card_sales REAL DEFAULT 0,
      other_sales REAL DEFAULT 0,
      total_customers INTEGER DEFAULT 0,
      average_ticket REAL DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Delivery Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS delivery_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      customer_id TEXT,
      delivery_status TEXT DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      delivery_phone TEXT,
      driver_id TEXT,
      delivery_fee REAL DEFAULT 0,
      estimated_delivery_time TEXT,
      actual_delivery_time TEXT,
      external_platform TEXT,
      external_order_id TEXT,
      tracking_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (driver_id) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Business Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_settings (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Mi Restaurante',
      business_name TEXT,
      rfc TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      logo_url TEXT,
      currency TEXT NOT NULL DEFAULT 'MXN',
      tax_rate REAL NOT NULL DEFAULT 0.16,
      tax_name TEXT NOT NULL DEFAULT 'IVA',
      ticket_header TEXT,
      ticket_footer TEXT DEFAULT 'Gracias por su visita!',
      points_per_currency REAL NOT NULL DEFAULT 1,
      currency_unit_amount REAL NOT NULL DEFAULT 10,
      daily_points_limit INTEGER NOT NULL DEFAULT 1000,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // Printers
  db.exec(`
    CREATE TABLE IF NOT EXISTS printers (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      name TEXT NOT NULL,
      connection_type TEXT DEFAULT 'network',
      ip_address TEXT,
      port INTEGER DEFAULT 9100,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Suppliers
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_id TEXT,
      category TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    )
  `)

  // Purchases
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      branch_id TEXT,
      supplier_id TEXT,
      user_id TEXT,
      invoice_number TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'received',
      payment_method TEXT DEFAULT 'cash',
      payment_status TEXT DEFAULT 'paid',
      notes TEXT,
      purchase_date TEXT NOT NULL,
      received_at TEXT,
      received_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      _synced INTEGER DEFAULT 0,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
      FOREIGN KEY (received_by) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `)

  // Purchase Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      inventory_item_id TEXT,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      received_quantity REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
    )
  `)

  // Sync Queue for offline operations
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    )
  `)

  // Printer Config (local)
  db.exec(`
    CREATE TABLE IF NOT EXISTS printer_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_name TEXT NOT NULL,
      connection_type TEXT NOT NULL,
      ip_address TEXT,
      port INTEGER DEFAULT 9100,
      paper_width INTEGER DEFAULT 80,
      is_default INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `)

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
    CREATE INDEX IF NOT EXISTS idx_tables_branch ON tables(branch_id);
    CREATE INDEX IF NOT EXISTS idx_tables_area ON tables(area_id);
    CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
  `)

  console.log('Database schema initialized successfully')
}
