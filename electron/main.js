import { app, BrowserWindow, ipcMain, net, shell } from 'electron'
import { join } from 'path'
import { initDatabase } from './database/connection.js'
import { setupPrinterHandlers } from './printer/printerService.js'
import { setupUpdater } from './updater.js'
import { isActivated, needsRevalidation, isGraceExpired, isInGracePeriod, activateLicense, revalidateLicense, getLicenseInfo, getLicense } from './license/licenseManager.js'

let mainWindow = null
let activationWindow = null
let db = null

const isDev = !app.isPackaged

console.log('=== Electron Main Process Started ===')
console.log('isDev:', isDev)
console.log('app.isPackaged:', app.isPackaged)
console.log('__dirname:', __dirname)
console.log('process.resourcesPath:', process.resourcesPath)

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
      sandbox: false
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
      sandbox: false
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

  // DevTools shortcut: Ctrl+Shift+I
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools()
    }
  })

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Window loaded, setting up window-dependent handlers...')
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

  ipcMain.handle('db:seed', async (event, seedData) => {
    try {
      const transaction = db.transaction((data) => {
        for (const branch of data.branches || []) {
          db.prepare('INSERT OR REPLACE INTO branches (id, name, code, address, phone, email, timezone, is_active, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(branch.id, branch.name, branch.code, branch.address, branch.phone, branch.email, branch.timezone, branch.is_active, branch.currency, branch.created_at, branch.updated_at)
        }
        for (const profile of data.profiles || []) {
          db.prepare('INSERT OR REPLACE INTO profiles (id, full_name, role, pin_code, is_active, email, branch_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(profile.id, profile.full_name, profile.role, profile.pin_code, profile.is_active, profile.email, profile.branch_id, profile.created_at, profile.updated_at)
        }
        for (const category of data.categories || []) {
          db.prepare('INSERT OR REPLACE INTO categories (id, name, menu_id, printer_id, created_at) VALUES (?, ?, ?, ?, ?)').run(category.id, category.name, category.menu_id, category.printer_id, category.created_at)
        }
        for (const product of data.products || []) {
          db.prepare('INSERT OR REPLACE INTO products (id, category_id, name, price, image_url, is_active, description, sku, branch_id, preparation_time, is_featured, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(product.id, product.category_id, product.name, product.price, product.image_url, product.is_active, product.description, product.sku, product.branch_id, product.preparation_time, product.is_featured, product.sort_order, product.created_at, product.updated_at)
        }
        for (const area of data.areas || []) {
          db.prepare('INSERT OR REPLACE INTO areas (id, name, branch_id, description, color, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(area.id, area.name, area.branch_id, area.description, area.color, area.sort_order, area.is_active, area.created_at, area.updated_at)
        }
        for (const table of data.tables || []) {
          db.prepare('INSERT OR REPLACE INTO tables (id, area_id, name, capacity, status, branch_id, shape, x_pos, y_pos, rotation, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(table.id, table.area_id, table.name, table.capacity, table.status, table.branch_id, table.shape, table.x_pos, table.y_pos, table.rotation, table.sort_order, table.is_active, table.created_at, table.updated_at)
        }
        for (const setting of data.settings || []) {
          db.prepare('INSERT OR REPLACE INTO business_settings (id, name, business_name, rfc, address, phone, email, currency, tax_rate, tax_name, ticket_header, ticket_footer, points_per_currency, currency_unit_amount, daily_points_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(setting.id, setting.name, setting.business_name, setting.rfc, setting.address, setting.phone, setting.email, setting.currency, setting.tax_rate, setting.tax_name, setting.ticket_header, setting.ticket_footer, setting.points_per_currency, setting.currency_unit_amount, setting.daily_points_limit, setting.created_at, setting.updated_at)
        }
      })
      transaction(seedData)
      return { success: true }
    } catch (error) {
      console.error('DB Seed Error:', error)
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
