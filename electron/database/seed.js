import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../shared/supabase.config.js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function seedDatabase(db) {
  console.log('Starting database seed from Supabase...')

  try {
    // Fetch all required data from Supabase
    const [branchesRes, profilesRes, productsRes, categoriesRes, tablesRes, areasRes, settingsRes, printersRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('products').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('tables').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('business_settings').select('*').limit(1),
      supabase.from('printers').select('*')
    ])

    // Check for errors
    if (branchesRes.error) throw new Error(`Branches error: ${branchesRes.error.message}`)
    if (profilesRes.error) throw new Error(`Profiles error: ${profilesRes.error.message}`)
    if (productsRes.error) throw new Error(`Products error: ${productsRes.error.message}`)
    if (categoriesRes.error) throw new Error(`Categories error: ${categoriesRes.error.message}`)
    if (tablesRes.error) throw new Error(`Tables error: ${tablesRes.error.message}`)
    if (areasRes.error) throw new Error(`Areas error: ${areasRes.error.message}`)
    if (settingsRes.error) throw new Error(`Settings error: ${settingsRes.error.message}`)
    if (printersRes.error) throw new Error(`Printers error: ${printersRes.error.message}`)

    const seedData = {
      branches: branchesRes.data || [],
      profiles: profilesRes.data || [],
      products: productsRes.data || [],
      categories: categoriesRes.data || [],
      tables: tablesRes.data || [],
      areas: areasRes.data || [],
      settings: settingsRes.data || [],
      printers: printersRes.data || []
    }

    // Insert data into SQLite
    const insertBranch = db.prepare(
      'INSERT OR REPLACE INTO branches (id, name, code, address, phone, email, timezone, is_active, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertProfile = db.prepare(
      'INSERT OR REPLACE INTO profiles (id, full_name, role, pin_code, is_active, email, permissions, branch_id, preferred_language, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertProduct = db.prepare(
      'INSERT OR REPLACE INTO products (id, category_id, name, price, image_url, is_active, description, sku, branch_id, preparation_time, is_featured, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertCategory = db.prepare(
      'INSERT OR REPLACE INTO categories (id, name, menu_id, printer_id, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    const insertTable = db.prepare(
      'INSERT OR REPLACE INTO tables (id, area_id, name, capacity, status, branch_id, shape, x_pos, y_pos, rotation, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertArea = db.prepare(
      'INSERT OR REPLACE INTO areas (id, name, branch_id, description, color, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertSettings = db.prepare(
      'INSERT OR REPLACE INTO business_settings (id, name, business_name, rfc, address, phone, email, currency, tax_rate, tax_name, ticket_header, ticket_footer, points_per_currency, currency_unit_amount, daily_points_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertPrinter = db.prepare(
      'INSERT OR REPLACE INTO printers (id, branch_id, name, connection_type, ip_address, port, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )

    // Execute transaction
    const transaction = db.transaction(() => {
      // Insert branches
      for (const branch of seedData.branches) {
        insertBranch.run(
          branch.id, branch.name, branch.code, branch.address,
          branch.phone, branch.email, branch.timezone,
          branch.is_active ? 1 : 0, branch.currency,
          branch.created_at, branch.updated_at
        )
      }

      // Insert profiles
      for (const profile of seedData.profiles) {
        insertProfile.run(
          profile.id, profile.full_name, profile.role,
          profile.pin_code, profile.is_active ? 1 : 0,
          profile.email, JSON.stringify(profile.permissions || {}),
          profile.branch_id, profile.preferred_language || 'es',
          profile.created_at, profile.updated_at
        )
      }

      // Insert categories
      for (const category of seedData.categories) {
        insertCategory.run(
          category.id, category.name, category.menu_id,
          category.printer_id, category.created_at
        )
      }

      // Insert products
      for (const product of seedData.products) {
        insertProduct.run(
          product.id, product.category_id, product.name,
          product.price, product.image_url,
          product.is_active ? 1 : 0, product.description,
          product.sku, product.branch_id,
          product.preparation_time || 0,
          product.is_featured ? 1 : 0,
          product.sort_order || 0,
          product.created_at, product.updated_at
        )
      }

      // Insert areas
      for (const area of seedData.areas) {
        insertArea.run(
          area.id, area.name, area.branch_id,
          area.description, area.color || '#2563eb',
          area.sort_order || 0, area.is_active ? 1 : 0,
          area.created_at, area.updated_at
        )
      }

      // Insert tables
      for (const table of seedData.tables) {
        insertTable.run(
          table.id, table.area_id, table.name,
          table.capacity || 4, table.status || 'available',
          table.branch_id, table.shape || 'rounded',
          table.x_pos || 20, table.y_pos || 20,
          table.rotation || 0, table.sort_order || 0,
          table.is_active ? 1 : 0,
          table.created_at, table.updated_at
        )
      }

      // Insert settings
      for (const setting of seedData.settings) {
        insertSettings.run(
          setting.id, setting.name, setting.business_name,
          setting.rfc, setting.address, setting.phone,
          setting.email, setting.currency || 'MXN',
          setting.tax_rate || 0.16, setting.tax_name || 'IVA',
          setting.ticket_header, setting.ticket_footer,
          setting.points_per_currency || 1,
          setting.currency_unit_amount || 10,
          setting.daily_points_limit || 1000,
          setting.created_at, setting.updated_at
        )
      }

      // Insert printers
      for (const printer of seedData.printers) {
        insertPrinter.run(
          printer.id, printer.branch_id, printer.name,
          printer.connection_type || 'network',
          printer.ip_address, printer.port || 9100,
          printer.is_active ? 1 : 0,
          printer.created_at, printer.updated_at
        )
      }
    })

    transaction()

    console.log('Database seeded successfully:')
    console.log(`- ${seedData.branches.length} branches`)
    console.log(`- ${seedData.profiles.length} profiles`)
    console.log(`- ${seedData.categories.length} categories`)
    console.log(`- ${seedData.products.length} products`)
    console.log(`- ${seedData.areas.length} areas`)
    console.log(`- ${seedData.tables.length} tables`)
    console.log(`- ${seedData.settings.length} settings`)
    console.log(`- ${seedData.printers.length} printers`)

    return { success: true, counts: {
      branches: seedData.branches.length,
      profiles: seedData.profiles.length,
      categories: seedData.categories.length,
      products: seedData.products.length,
      areas: seedData.areas.length,
      tables: seedData.tables.length,
      settings: seedData.settings.length,
      printers: seedData.printers.length
    }}
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}
