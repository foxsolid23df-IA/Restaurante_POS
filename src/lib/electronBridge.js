// Electron Bridge - Detects if running in Electron or Web browser

export const isElectron = !!(typeof window !== 'undefined' && window.electronAPI?.app?.isElectron)

export const electronAPI = isElectron ? window.electronAPI : null

// Database operations - uses SQLite in Electron, Supabase in web
export const db = {
  // Check if we're in Electron mode
  isElectron,

  // Query data
  query: async (sql, params = []) => {
    if (isElectron) {
      return window.electronAPI.db.query(sql, params)
    }
    throw new Error('Direct SQL queries not available in web mode')
  },

  // Run mutation (INSERT, UPDATE, DELETE)
  run: async (sql, params = []) => {
    if (isElectron) {
      return window.electronAPI.db.run(sql, params)
    }
    throw new Error('Direct SQL mutations not available in web mode')
  },

  // Run multiple operations in a transaction
  transaction: async (operations) => {
    if (isElectron) {
      return window.electronAPI.db.transaction(operations)
    }
    throw new Error('Transactions not available in web mode')
  },

  // Check if database needs initial seed
  needsSeed: async () => {
    if (isElectron) {
      return window.electronAPI.db.needsSeed()
    }
    return false
  },

  // Seed database from Supabase data
  seed: async (data) => {
    if (isElectron) {
      return window.electronAPI.db.seed(data)
    }
    throw new Error('Database seeding not available in web mode')
  },

  // Check network status
  isOnline: async () => {
    if (isElectron) {
      return window.electronAPI.db.isOnline()
    }
    return navigator.onLine
  }
}

// Printer operations
export const printer = {
  list: async () => {
    if (isElectron) {
      return window.electronAPI.printer.list()
    }
    return []
  },

  print: async (data) => {
    if (isElectron) {
      return window.electronAPI.printer.print(data)
    }
    // Fallback to HTTP bridge for web mode
    try {
      const response = await fetch('http://localhost:5000/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      console.error('Printer bridge error:', error)
      return { success: false, error: 'Printer bridge not available' }
    }
  },

  test: async (config) => {
    if (isElectron) {
      return window.electronAPI.printer.test(config)
    }
    return { success: false, error: 'Printer test not available in web mode' }
  },

  getConfig: async () => {
    if (isElectron) {
      return window.electronAPI.printer.getConfig()
    }
    // Return default config for web mode
    return {
      printer_name: '',
      connection_type: 'network',
      ip_address: '192.168.1.100',
      port: 9100,
      paper_width: 80
    }
  },

  saveConfig: async (config) => {
    if (isElectron) {
      return window.electronAPI.printer.saveConfig(config)
    }
    return { success: false, error: 'Printer config not available in web mode' }
  }
}

// Updater operations
export const updater = {
  check: async () => {
    if (isElectron) {
      return window.electronAPI.updater.check()
    }
    return { success: false, error: 'Updater not available in web mode' }
  },

  install: async () => {
    if (isElectron) {
      return window.electronAPI.updater.install()
    }
    return { success: false, error: 'Updater not available in web mode' }
  },

  onUpdateAvailable: (callback) => {
    if (isElectron) {
      window.electronAPI.updater.onUpdateAvailable(callback)
    }
  },

  onUpdateDownloaded: (callback) => {
    if (isElectron) {
      window.electronAPI.updater.onUpdateDownloaded(callback)
    }
  },

  onDownloadProgress: (callback) => {
    if (isElectron) {
      window.electronAPI.updater.onDownloadProgress(callback)
    }
  }
}

// App operations
export const app = {
  getInfo: async () => {
    if (isElectron) {
      return window.electronAPI.app.getInfo()
    }
    return { version: 'web', name: 'Restaurante POS Web', isElectron: false }
  },

  restart: async () => {
    if (isElectron) {
      return window.electronAPI.app.restart()
    }
    window.location.reload()
  },

  openExternal: async (url) => {
    if (isElectron) {
      return window.electronAPI.app.openExternal(url)
    }
    window.open(url, '_blank')
  }
}

// License operations
export const license = {
  activate: async (email, password) => {
    if (isElectron) {
      return window.electronAPI.license.activate(email, password)
    }
    return { success: false, error: 'Activación solo disponible en la app de escritorio' }
  },

  status: async () => {
    if (isElectron) {
      return window.electronAPI.license.status()
    }
    return { activated: false, needsActivation: false }
  }
}

// Convenience export
export default {
  isElectron,
  db,
  printer,
  updater,
  app,
  license
}
