import { createClient } from '@supabase/supabase-js'
import { app, net } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../shared/supabase.config.js'

let supabase = null
let syncInProgress = false
let syncInterval = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}

// Add operation to sync queue
export function addToSyncQueue(db, tableName, recordId, operation, payload) {
  const stmt = db.prepare(
    'INSERT INTO sync_queue (table_name, record_id, operation, payload, created_at, synced) VALUES (?, ?, ?, ?, datetime(\'now\'), 0)'
  )
  stmt.run(tableName, recordId, operation, JSON.stringify(payload))
  console.log(`Added to sync queue: ${operation} on ${tableName} (${recordId})`)
}

// Process sync queue
async function processSyncQueue(db) {
  if (syncInProgress) return
  syncInProgress = true

  try {
    const pending = db.prepare(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY id ASC LIMIT 50'
    ).all()

    if (pending.length === 0) {
      syncInProgress = false
      return
    }

    console.log(`Processing ${pending.length} pending sync operations...`)
    const client = getSupabaseClient()

    for (const item of pending) {
      try {
        const payload = JSON.parse(item.payload)

        switch (item.operation) {
          case 'INSERT':
            await client.from(item.table_name).insert(payload)
            break
          case 'UPDATE':
            await client.from(item.table_name).update(payload).eq('id', item.record_id)
            break
          case 'DELETE':
            await client.from(item.table_name).delete().eq('id', item.record_id)
            break
          default:
            console.warn(`Unknown operation: ${item.operation}`)
        }

        // Mark as synced
        db.prepare('UPDATE sync_queue SET synced = 1 WHERE id = ?').run(item.id)
        console.log(`Synced: ${item.operation} on ${item.table_name} (${item.record_id})`)
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error)

        // Update retry count and error
        db.prepare(
          'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?'
        ).run(error.message, item.id)

        // If too many retries, mark as failed but don't block other items
        if (item.retry_count >= 3) {
          console.error(`Skipping item ${item.id} after 3 retries`)
        }
      }
    }

    // Clean up old synced items (older than 7 days)
    db.prepare(
      'DELETE FROM sync_queue WHERE synced = 1 AND created_at < datetime(\'now\', \'-7 days\')'
    ).run()

    console.log('Sync queue processing completed')
  } catch (error) {
    console.error('Error processing sync queue:', error)
  } finally {
    syncInProgress = false
  }
}

async function downloadProductImages(db) {
  try {
    const products = db.prepare(
      "SELECT id, image_url, local_image_path FROM products WHERE is_active = 1 AND image_url IS NOT NULL AND image_url != ''"
    ).all()

    if (products.length === 0) return

    const imagesDir = join(app.getPath('userData'), 'images', 'products')
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true })
    }

    const updateStmt = db.prepare('UPDATE products SET local_image_path = ? WHERE id = ?')
    let downloaded = 0

    for (const product of products) {
      try {
        const ext = product.image_url.split('?')[0].split('.').pop() || 'jpg'
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext.toLowerCase()) ? ext : 'jpg'
        const localPath = join(imagesDir, `${product.id}.${safeExt}`)

        if (existsSync(localPath) && product.local_image_path === localPath) {
          continue
        }

        const response = await fetch(product.image_url)
        if (!response.ok) {
          console.warn(`Failed to download image for product ${product.id}: ${response.status}`)
          continue
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        writeFileSync(localPath, buffer)
        updateStmt.run(localPath, product.id)
        downloaded++
      } catch (imageError) {
        console.warn(`Error downloading image for product ${product.id}:`, imageError.message)
      }
    }

    console.log(`Downloaded ${downloaded} product images`)
  } catch (error) {
    console.error('Error in downloadProductImages:', error)
  }
}

// Serialize values for SQLite binding (JSONB fields, dates, booleans, etc.)
function serializeValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (Array.isArray(value)) return JSON.stringify(value)
  if (typeof value === 'object' && value.constructor === Object) return JSON.stringify(value)
  if (value instanceof Date) return value.toISOString()
  return value
}

// Ensure sync_config table exists
function ensureSyncConfig(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

// Get the column names that exist in both the Supabase data AND the local SQLite table
function getLocalColumns(db, tableName, remoteKeys) {
  try {
    const pragma = db.pragma(`table_info(${tableName})`)
    const localCols = new Set(pragma.map((col) => col.name))
    return remoteKeys.filter((key) => localCols.has(key))
  } catch {
    return remoteKeys
  }
}

// Tables that should be synced from remote
const TABLES_TO_SYNC = [
  'branches',
  'menus',
  'profiles',
  'categories',
  'products',
  'printers',
  'tables',
  'areas',
  'orders',
  'order_items',
  'customers',
  'reservations',
  'loyalty_transactions'
]

// Tables that have an updated_at column for incremental sync
const TABLES_WITH_UPDATED_AT = new Set([
  'branches',
  'menus',
  'profiles',
  'products',
  'printers',
  'tables',
  'areas',
  'customers',
  'reservations',
  'loyalty_transactions',
  'delivery_orders',
  'inventory_items',
  'business_settings'
])

// Pull remote changes (from Supabase to local SQLite)
async function pullRemoteChanges(db, lastSyncTime, forceFull = false) {
  const failedTables = []

  try {
    // Ensure sync_config table exists
    ensureSyncConfig(db)

    const client = getSupabaseClient()

    // Disable FK constraints during pull (same pattern as seed handler)
    // INSERT OR REPLACE does DELETE+INSERT which can fail with FK chains
    db.exec('PRAGMA foreign_keys = OFF')
    try {

    for (const tableName of TABLES_TO_SYNC) {
      try {
        let query = client.from(tableName).select('*')

        // Only use updated_at filter for tables that have it AND we have a previous sync time
        if (!forceFull && lastSyncTime && TABLES_WITH_UPDATED_AT.has(tableName)) {
          query = query.gt('updated_at', lastSyncTime)
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error pulling ${tableName}:`, error.message)
          failedTables.push(tableName)
          continue
        }

        if (!data || data.length === 0) continue

        // Get column names that exist in both remote data and local schema
        const columns = getLocalColumns(db, tableName, Object.keys(data[0]))

        if (columns.length === 0) {
          console.warn(`No matching columns for table ${tableName}, skipping`)
          failedTables.push(tableName)
          continue
        }

        // Serialize values for SQLite (convert arrays/objects to JSON strings)
        const upsertStmt = db.prepare(
          `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
        )

        const upsertMany = db.transaction((records) => {
          for (const record of records) {
            const values = columns.map((col) => serializeValue(record[col]))
            upsertStmt.run(...values)
          }
        })

        upsertMany(data)
        console.log(`Pulled ${data.length} records from ${tableName}`)
      } catch (error) {
        console.error(`Error syncing table ${tableName}:`, error.message)
        failedTables.push(tableName)
      }
    }

    // Only update last_sync_time if ALL tables succeeded
    if (failedTables.length === 0) {
      db.prepare(
        'INSERT OR REPLACE INTO sync_config (key, value) VALUES (?, ?)'
      ).run('last_sync_time', new Date().toISOString())
      console.log('All tables synced successfully')
    } else {
      console.warn(`Sync completed with errors. Failed tables: ${failedTables.join(', ')}`)
      // Store failed tables info for debugging
      db.prepare(
        'INSERT OR REPLACE INTO sync_config (key, value) VALUES (?, ?)'
      ).run('last_sync_failed_tables', failedTables.join(','))
      db.prepare(
        'INSERT OR REPLACE INTO sync_config (key, value) VALUES (?, ?)'
      ).run('last_sync_failed_at', new Date().toISOString())
    }
    } finally {
      // Re-enable FK constraints
      db.exec('PRAGMA foreign_keys = ON')
    }
  } catch (error) {
    console.error('Error pulling remote changes:', error)
  }
}

// Get last sync time
function getLastSyncTime(db) {
  try {
    const result = db.prepare(
      'SELECT value FROM sync_config WHERE key = ?'
    ).get('last_sync_time')
    return result ? result.value : null
  } catch {
    return null
  }
}

// Start automatic sync
export function startAutoSync(db, intervalMs = 30000) {
  // Stop any existing sync
  stopAutoSync()

  // Initial sync check
  if (net.isOnline()) {
    processSyncQueue(db)
    pullRemoteChanges(db, getLastSyncTime(db)).then(() => downloadProductImages(db))
  }

  // Set up interval
  syncInterval = setInterval(() => {
    if (net.isOnline()) {
      processSyncQueue(db)
      pullRemoteChanges(db, getLastSyncTime(db)).then(() => downloadProductImages(db))
    }
  }, intervalMs)

  console.log(`Auto-sync started with interval: ${intervalMs}ms`)
}

// Stop automatic sync
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('Auto-sync stopped')
  }
}

// Manual sync trigger (incremental)
export async function manualSync(db) {
  if (!net.isOnline()) {
    return { success: false, error: 'No internet connection' }
  }

  try {
    await processSyncQueue(db)
    await pullRemoteChanges(db, getLastSyncTime(db))
    await downloadProductImages(db)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Force full sync - ignores last_sync_time and pulls everything from Supabase
export async function forceFullSync(db) {
  if (!net.isOnline()) {
    return { success: false, error: 'No internet connection' }
  }

  try {
    console.log('Starting forced full sync...')
    await processSyncQueue(db)
    // Pass forceFull=true to ignore updated_at filters
    await pullRemoteChanges(db, null, true)
    await downloadProductImages(db)
    console.log('Forced full sync completed')
    return { success: true }
  } catch (error) {
    console.error('Error during forced full sync:', error)
    return { success: false, error: error.message }
  }
}

// Create sync_config table if not exists
export function initializeSyncConfig(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
}
