import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { initializeSchema } from './schema.js'

let db = null

export function initDatabase() {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'pos-local.db')
  console.log('Database path:', dbPath)

  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')

  // Initialize schema
  initializeSchema(db)

  return db
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
