import { app, BrowserWindow, ipcMain, net, shell } from 'electron'
import { join } from 'path'
import { existsSync, writeFileSync, readFileSync, appendFileSync, mkdirSync } from 'fs'
import { initDatabase } from './database/connection.js'
import { setupPrinterHandlers } from './printer/printerService.js'
import { setupUpdater } from './updater.js'
import { manualSync, startAutoSync } from './database/sync.js'
import { isActivated, needsRevalidation, isGraceExpired, isInGracePeriod, activateLicense, revalidateLicense, getLicenseInfo, getLicense } from './license/licenseManager.js'

let mainWindow = null
let activationWindow = null
let db = null

const isDev = !app.isPackaged

// File logger for packaged builds (DevTools inaccessible)
const logDir = app.getPath('userData')
const logPath = join(logDir, 'pos-debug.log')

try {
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })
  writeFileSync(logPath, `=== Restaurante POS Debug Log - ${new Date().toISOString()} ===\n`)
} catch (e) {
  // ignore logger init errors
}

export function logToFile(level, ...args) {
  try {
    const line = `[${new Date().toISOString()}] [${level}] ${args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}\n`
    appendFileSync(logPath, line)
  } catch (e) {
    // ignore
  }
}

const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = (...args) => { logToFile('INFO', ...args); originalLog(...args) }
console.error = (...args) => { logToFile('ERROR', ...args); originalError(...args) }
console.warn = (...args) => { logToFile('WARN', ...args); originalWarn(...args) }

console.log('=== Electron Main Process Started ===')
console.log('isDev:', isDev)
console.log('app.isPackaged:', app.isPackaged)
console.log('__dirname:', __dirname)
console.log('process.resourcesPath:', process.resourcesPath)
console.log('Log file:', logPath)

// Zoom preferences
const ZOOM_PREFS_FILE = join(logDir, 'user-preferences.json')
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0
const ZOOM_STEP = 0.2
const DEFAULT_ZOOM = 1.0

function readZoomPreferences() {
  try {
    if (existsSync(ZOOM_PREFS_FILE)) {
      const data = JSON.parse(readFileSync(ZOOM_PREFS_FILE, 'utf8'))
      return typeof data.zoomFactor === 'number' ? data.zoomFactor : DEFAULT_ZOOM
    }
  } catch (e) {
    console.error('Error reading zoom preferences:', e)
  }
  return DEFAULT_ZOOM
}

function saveZoomPreferences(zoomFactor) {
  try {
    writeFileSync(ZOOM_PREFS_FILE, JSON.stringify({ zoomFactor }, null, 2))
  } catch (e) {
    console.error('Error saving zoom preferences:', e)
  }
}

function clampZoom(zoomFactor) {
  return Math.min(Math.max(zoomFactor, MIN_ZOOM), MAX_ZOOM)
}

function applyZoom(targetWindow, zoomFactor) {
  if (!targetWindow || targetWindow.isDestroyed()) return null
  const clamped = clampZoom(zoomFactor)
  targetWindow.webContents.setZoomFactor(clamped)
  return clamped
}

async function setZoom(zoomFactor) {
  const clamped = clampZoom(zoomFactor)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.setZoomFactor(clamped)
  }
  saveZoomPreferences(clamped)
  return clamped
}

async function zoomIn() {
  const current = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.getZoomFactor() : readZoomPreferences()
  return setZoom(current + ZOOM_STEP)
}

async function zoomOut() {
  const current = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.getZoomFactor() : readZoomPreferences()
  return setZoom(current - ZOOM_STEP)
}

async function zoomReset() {
  return setZoom(DEFAULT_ZOOM)
}

function setupZoomHandlers() {
  ipcMain.handle('window:getZoom', async () => readZoomPreferences())
  ipcMain.handle('window:setZoom', async (event, zoomFactor) => setZoom(zoomFactor))
  ipcMain.handle('window:zoomIn', zoomIn)
  ipcMain.handle('window:zoomOut', zoomOut)
  ipcMain.handle('window:zoomReset', zoomReset)
}

function setupSyncHandlers() {
  ipcMain.handle('sync:now', async () => {
    if (!db) {
      return { success: false, error: 'Database not initialized' }
    }
    return manualSync(db)
  })
}

function createActivationWindow() {
  if (activationWindow && !activationWindow.isDestroyed()) {
    activationWindow.focus()
    return
  }

  activationWindow = new BrowserWindow({
    width: 520,
    height: 680,
    resizable: false,
    autoHideMenuBar: true,
    title: 'Activar Licencia - Restaurante POS',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false
    }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    activationWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/activate`)
  } else {
    activationWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/activate' })
  }

  if (isDev) {
    activationWindow.webContents.openDevTools({ mode: 'detach' })
  }

  activationWindow.on('closed', () => {
    activationWindow = null
    if (!mainWindow && BrowserWindow.getAllWindows().length === 0) {
      app.quit()
    }
  })

  return activationWindow
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    title: 'Restaurante POS',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false
    }
  })

  // Dev server or production build
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('Loading from dev server:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    console.log('Loading from file:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // Open DevTools in dev mode only
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (level >= 2) {
      console.log(`[Renderer level ${level}]:`, message)
    }
  })

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // DevTools shortcuts: Ctrl+Shift+I or F12
  // Zoom shortcuts: Ctrl++ / Ctrl+- / Ctrl+0
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
      mainWindow.webContents.toggleDevTools()
      return
    }

    if (input.control) {
      const key = input.key.toLowerCase()
      if (key === '+' || key === '=') {
        event.preventDefault()
        zoomIn()
      } else if (key === '-') {
        event.preventDefault()
        zoomOut()
      } else if (key === '0') {
        event.preventDefault()
        zoomReset()
      }
    }
  })

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Window loaded, setting up window-dependent handlers...')
    const savedZoom = readZoomPreferences()
    applyZoom(mainWindow, savedZoom)
    setupPrinterHandlers(mainWindow, db)
    setupUpdater(mainWindow)
  })

  return mainWindow
}

function setupDatabaseHandlers() {
  if (!db) return

  ipcMain.handle('db:query', async (event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql)
      return stmt.all(...params)
    } catch (error) {
      console.error('DB Query Error:', error)
      throw error
    }
  })

  ipcMain.handle('db:run', async (event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql)
      const result = stmt.run(...params)
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid }
    } catch (error) {
      console.error('DB Run Error:', error)
      throw error
    }
  })

  ipcMain.handle('db:transaction', async (event, operations) => {
    try {
      const transaction = db.transaction((ops) => {
        const results = []
        for (const { sql, params } of ops) {
          const stmt = db.prepare(sql)
          const result = stmt.run(...(params || []))
          results.push({ changes: result.changes, lastInsertRowid: result.lastInsertRowid })
        }
        return results
      })
      return transaction(operations)
    } catch (error) {
      console.error('DB Transaction Error:', error)
      throw error
    }
  })

  ipcMain.handle('db:needsSeed', async () => {
    try {
      const result = db.prepare('SELECT COUNT(*) as count FROM branches').get()
      return result.count === 0
    } catch {
      return true
    }
  })

  // Normalize values for SQLite binding
  const normalize = (value, stringifyObjects = false) => {
    if (value === undefined || value === null) return null
    if (typeof value === 'boolean') return value ? 1 : 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') return value
    if (Buffer.isBuffer(value)) return value
    if (typeof value === 'bigint') return value
    // Convert objects/arrays to JSON string when requested (e.g. permissions)
    if (stringifyObjects) return JSON.stringify(value)
    return String(value)
  }

  const normalizeRow = (row, objectFields = []) => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        normalize(value, objectFields.includes(key))
      ])
    )
  }

  const withDefaults = (row, defaults = {}) => {
    const normalized = normalizeRow(row)
    const result = { ...normalized }
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (result[key] === null || result[key] === undefined) {
        result[key] = defaultValue
      }
    }
    return result
  }

  const now = new Date().toISOString()

  ipcMain.handle('db:seed', async (event, seedData) => {
    try {
      // Disable foreign keys during seed to avoid ordering issues with partial data
      db.exec('PRAGMA foreign_keys = OFF')

      const transaction = db.transaction((data) => {
        for (const branch of data.branches || []) {
          const b = withDefaults(branch, { timezone: 'America/Mexico_City', currency: 'MXN', is_active: 1, created_at: now, updated_at: now })
          db.prepare('INSERT OR REPLACE INTO branches (id, name, code, address, phone, email, timezone, is_active, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(b.id, b.name, b.code, b.address, b.phone, b.email, b.timezone, b.is_active, b.currency, b.created_at, b.updated_at)
        }
        for (const menu of data.menus || []) {
          const m = withDefaults(menu, { is_active: 1, created_at: now, updated_at: now })
          db.prepare('INSERT OR REPLACE INTO menus (id, branch_id, name, start_time, end_time, active_days, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(m.id, m.branch_id, m.name, m.start_time, m.end_time, m.active_days, m.is_active, m.created_at, m.updated_at)
        }
        for (const profile of data.profiles || []) {
          const p = withDefaults(profile, { role: 'waiter', is_active: 1, created_at: now, updated_at: now })
          const normalized = normalizeRow(p, ['permissions'])
          db.prepare('INSERT OR REPLACE INTO profiles (id, full_name, role, pin_code, pin_code_hash, is_active, email, permissions, branch_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(normalized.id, normalized.full_name, normalized.role, normalized.pin_code, normalized.pin_code_hash, normalized.is_active, normalized.email, normalized.permissions, normalized.branch_id, normalized.created_at, normalized.updated_at)
        }
        for (const category of data.categories || []) {
          const c = withDefaults(category, { created_at: now })
          db.prepare('INSERT OR REPLACE INTO categories (id, name, menu_id, printer_id, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(c.id, c.name, c.menu_id, c.printer_id, c.created_at)
        }
        for (const product of data.products || []) {
          const p = withDefaults(product, { is_active: 1, is_featured: 0, sort_order: 0, preparation_time: 0, created_at: now, updated_at: now })
          db.prepare('INSERT OR REPLACE INTO products (id, category_id, name, price, image_url, is_active, description, sku, branch_id, preparation_time, is_featured, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(p.id, p.category_id, p.name, p.price, p.image_url, p.is_active, p.description, p.sku, p.branch_id, p.preparation_time, p.is_featured, p.sort_order, p.created_at, p.updated_at)
        }
        for (const area of data.areas || []) {
          const a = withDefaults(area, { color: '#2563eb', sort_order: 0, is_active: 1, created_at: now, updated_at: now })
          db.prepare('INSERT OR REPLACE INTO areas (id, name, branch_id, description, color, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(a.id, a.name, a.branch_id, a.description, a.color, a.sort_order, a.is_active, a.created_at, a.updated_at)
        }
        for (const table of data.tables || []) {
          const t = withDefaults(table, { capacity: 4, status: 'available', shape: 'rounded', x_pos: 20, y_pos: 20, rotation: 0, sort_order: 0, is_active: 1, created_at: now, updated_at: now })
          db.prepare('INSERT OR REPLACE INTO tables (id, area_id, name, capacity, status, branch_id, shape, x_pos, y_pos, rotation, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(t.id, t.area_id, t.name, t.capacity, t.status, t.branch_id, t.shape, t.x_pos, t.y_pos, t.rotation, t.sort_order, t.is_active, t.created_at, t.updated_at)
        }
        for (const setting of data.settings || []) {
          const s = withDefaults(setting, { currency: 'MXN', tax_rate: 0.16, tax_name: 'IVA', points_per_currency: 1, currency_unit_amount: 10, daily_points_limit: 1000, created_at: now, updated_at: now })
          db.prepare('INSERT OR REPLACE INTO business_settings (id, name, business_name, rfc, address, phone, email, currency, tax_rate, tax_name, ticket_header, ticket_footer, points_per_currency, currency_unit_amount, daily_points_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(s.id, s.name, s.business_name, s.rfc, s.address, s.phone, s.email, s.currency, s.tax_rate, s.tax_name, s.ticket_header, s.ticket_footer, s.points_per_currency, s.currency_unit_amount, s.daily_points_limit, s.created_at, s.updated_at)
        }
      })
      transaction(seedData)

      // Re-enable foreign keys after seed
      db.exec('PRAGMA foreign_keys = ON')

      console.log('DB Seed completed successfully')
      return { success: true }
    } catch (error) {
      console.error('DB Seed Error:', error)
      // Ensure foreign keys are re-enabled even on error
      try { db.exec('PRAGMA foreign_keys = ON') } catch (e) {}
      throw error
    }
  })

  ipcMain.handle('db:isOnline', async () => {
    return net.isOnline()
  })

  ipcMain.handle('app:getInfo', async () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      isElectron: true
    }
  })

  ipcMain.handle('app:restart', async () => {
    app.relaunch()
    app.exit(0)
  })

  ipcMain.handle('app:openExternal', async (event, url) => {
    await shell.openExternal(url)
  })

  ipcMain.handle('app:getLogPath', async () => logPath)

  ipcMain.handle('logger:write', async (event, level, message) => {
    logToFile(level, message)
  })
}

function setupLicenseHandlers() {
  ipcMain.handle('license:activate', async (event, { email, password }) => {
    try {
      const result = await activateLicense(email, password)
      if (result.success) {
        if (activationWindow && !activationWindow.isDestroyed()) {
          activationWindow.close()
        }
        if (!mainWindow) {
          createWindow()
        }
      }
      return result
    } catch (error) {
      console.error('License activation error:', error)
      return { success: false, error: 'Error interno al activar la licencia' }
    }
  })

  ipcMain.handle('license:status', async () => {
    try {
      const info = getLicenseInfo()
      if (!info.activated) {
        return { activated: false, needsActivation: true }
      }

      if (info.needsRevalidation) {
        if (info.graceExpired) {
          return { activated: true, needsActivation: true, reason: 'grace_expired' }
        }
        const reval = await revalidateLicense()
        if (!reval.valid) {
          if (reval.reason === 'network_error' && info.inGracePeriod) {
            return { activated: true, needsRevalidation: true, inGracePeriod: true, email: info.email }
          }
          return { activated: true, needsActivation: true, reason: reval.reason, email: info.email }
        }
        return { activated: true, needsRevalidation: false, email: info.email }
      }

      return { activated: true, needsRevalidation: false, email: info.email }
    } catch (error) {
      console.error('License status error:', error)
      const license = getLicense()
      if (license && isInGracePeriod()) {
        return { activated: true, needsRevalidation: true, inGracePeriod: true, email: license.email }
      }
      return { activated: false, needsActivation: true }
    }
  })
}

app.whenReady().then(async () => {
  console.log('Initializing database...')
  try {
    db = initDatabase()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }

  setupLicenseHandlers()
  setupDatabaseHandlers()
  setupZoomHandlers()
  setupSyncHandlers()
  if (db) {
    startAutoSync(db)
  }

  const activated = isActivated()
  if (!activated) {
    createActivationWindow()
  } else if (needsRevalidation()) {
    try {
      const result = await revalidateLicense()
      if (!result.valid) {
        if (result.reason === 'network_error' && isInGracePeriod()) {
          console.log('Offline - using grace period')
          createWindow()
        } else {
          createActivationWindow()
        }
      } else {
        createWindow()
      }
    } catch {
      if (isInGracePeriod()) {
        createWindow()
      } else {
        createActivationWindow()
      }
    }
  } else {
    createWindow()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const activated2 = isActivated()
      if (!activated2) {
        createActivationWindow()
      } else {
        createWindow()
      }
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (db) {
    db.close()
  }
})
