/**
 * Service to communicate with the local printer bridge
 * Supports both Electron (direct) and Web (HTTP bridge) modes
 */
import { isElectron, electronAPI } from './electronBridge'

const BRIDGE_URL = 'http://localhost:5000/print'

export const printerBridge = {
  /**
   * Check if Electron printer API is available
   */
  isElectronAvailable: () => {
    return isElectron && electronAPI?.printer
  },

  /**
   * Send raw data or structured data to the local bridge
   * @param {Object} payload
   */
  send: async (payload) => {
    // Use Electron API if available
    if (printerBridge.isElectronAvailable()) {
      try {
        return await electronAPI.printer.print(payload)
      } catch (error) {
        console.error('Electron Printer Error:', error)
        throw error
      }
    }

    // Fallback to HTTP bridge
    try {
      const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('No se pudo conectar con el bridge de impresión')
      }

      return await response.json()
    } catch (error) {
      console.error('Printer Bridge Error:', error)
      throw new Error('Asegúrese de que el Local Bridge esté ejecutándose en este equipo.')
    }
  },

  /**
   * Print raw ESC/POS commands
   * @param {string} rawData
   * @param {Object} printerConfig
   */
  printRaw: async (rawData, printerConfig) => {
    return await printerBridge.send({
      type: 'raw',
      data: btoa(rawData), // Send as base64 to avoid encoding issues
      printer: printerConfig
    })
  },

  /**
   * Print a receipt (Electron mode only)
   * @param {Object} orderData
   * @param {Object} businessSettings
   * @param {Object} printerConfig
   */
  printReceipt: async (orderData, businessSettings, printerConfig) => {
    if (printerBridge.isElectronAvailable()) {
      return await electronAPI.printer.print({
        orderData,
        businessSettings,
        printerConfig
      })
    }

    // For web mode, use the HTTP bridge
    return await printerBridge.send({
      type: 'receipt',
      orderData,
      businessSettings,
      printer: printerConfig
    })
  },

  /**
   * Print a test page to verify connection
   * @param {Object} printerConfig
   */
  test: async (printerConfig) => {
    if (printerBridge.isElectronAvailable()) {
      return await electronAPI.printer.test(printerConfig)
    }

    return await printerBridge.send({
      type: 'test',
      printer: printerConfig
    })
  },

  /**
   * List available printers (Electron mode only)
   */
  listPrinters: async () => {
    if (printerBridge.isElectronAvailable()) {
      return await electronAPI.printer.list()
    }

    // Return default printers for web mode
    return [
      { name: 'POS-80', type: 'thermal', status: 'available' },
      { name: 'Default', type: 'system', status: 'available' }
    ]
  },

  /**
   * Get printer configuration
   */
  getConfig: async () => {
    if (printerBridge.isElectronAvailable()) {
      return await electronAPI.printer.getConfig()
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

  /**
   * Save printer configuration
   * @param {Object} config
   */
  saveConfig: async (config) => {
    if (printerBridge.isElectronAvailable()) {
      return await electronAPI.printer.saveConfig(config)
    }

    // For web mode, store in localStorage
    localStorage.setItem('printerConfig', JSON.stringify(config))
    return { success: true }
  }
}

export default printerBridge
