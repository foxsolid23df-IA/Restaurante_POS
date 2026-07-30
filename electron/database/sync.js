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

// Pull remote changes (from Supabase to local SQLite)
async function pullRemoteChanges(db, lastSyncTime) {
  try {
    const client = getSupabaseClient()

    // Tables to sync from remote
    const tablesToSync = [
      'orders',
      'order_items',
      'tables',
      'areas',
      'customers',
      'reservations',
      'loyalty_transactions',
      'products',
      'categories',
      'menus'
    ]

    for (const tableName of tablesToSync) {
      try {
        let query = client.from(tableName).select('*')

        // If we have a last sync time, only get changes since then
        if (lastSyncTime) {
          query = query.gt('updated_at', lastSyncTime)
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error pulling ${tableName}:`, error)
          continue
        }

        if (data && data.length > 0) {
          // Upsert data into local SQLite
          const upsertStmt = db.prepare(
            `INSERT OR REPLACE INTO ${tableName} (${Object.keys(data[0]).join(', ')}) VALUES (${Object.keys(data[0]).map(() => '?').join(', ')})`
          )

          const upsertMany = db.transaction((records) => {
            for (const record of records) {
              upsertStmt.run(...Object.values(record))
            }
          })

          upsertMany(data)
          console.log(`Pulled ${data.length} records from ${tableName}`)
        }
      } catch (error) {
        console.error(`Error syncing table ${tableName}:`, error)
      }
    }

    // Update last sync time
    db.prepare(
      'INSERT OR REPLACE INTO sync_config (key, value) VALUES (?, ?)'
    ).run('last_sync_time', new Date().toISOString())
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

// Manual sync trigger
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
