import { ipcMain, app } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync, writeFileSync } from 'fs'

// Printer configuration file path
function getConfigPath() {
  return join(app.getPath('userData'), 'printer-config.json')
}

// Load printer configuration
function loadConfig() {
  const configPath = getConfigPath()
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8'))
    } catch (error) {
      console.error('Error loading printer config:', error)
    }
  }
  return {
    printer_name: '',
    connection_type: 'network',
    ip_address: '192.168.1.100',
    port: 9100,
    paper_width: 80,
    is_default: true
  }
}

// Save printer configuration
function saveConfig(config) {
  const configPath = getConfigPath()
  writeFileSync(configPath, JSON.stringify(config, null, 2))
  return true
}

// Build ESC/POS receipt data
function buildReceiptData(orderData, businessSettings) {
  const lines = []
  const paperWidth = businessSettings.paper_width || 80
  const lineWidth = paperWidth === 58 ? 32 : 48

  // Helper functions
  const center = (text) => text.padStart((lineWidth + text.length) / 2).padEnd(lineWidth)
  const left = (text) => text.padEnd(lineWidth)
  const right = (text) => text.padStart(lineWidth)
  const line = (char = '-') => char.repeat(lineWidth)

  // Header
  if (businessSettings.ticket_header) {
    lines.push(center(businessSettings.ticket_header))
  }
  lines.push(center(businessSettings.business_name || 'Restaurante'))
  lines.push(center(businessSettings.address || ''))
  lines.push(center(`RFC: ${businessSettings.rfc || 'N/A'}`))
  lines.push(center(`Tel: ${businessSettings.phone || 'N/A'}`))
  lines.push(line())

  // Order info
  lines.push(`Orden: ${orderData.orderId}`)
  lines.push(`Mesa: ${orderData.tableName || 'N/A'}`)
  lines.push(`Fecha: ${new Date().toLocaleDateString('es-MX')}`)
  lines.push(`Hora: ${new Date().toLocaleTimeString('es-MX')}`)
  lines.push(`Mesero: ${orderData.waiterName || 'N/A'}`)
  lines.push(line())

  // Items
  lines.push(center('ARTICULOS'))
  lines.push(line())
  orderData.items.forEach(item => {
    lines.push(left(`${item.quantity}x ${item.name}`))
    lines.push(right(`$${(item.price * item.quantity).toFixed(2)}`))
    if (item.notes) {
      lines.push(left(`  Nota: ${item.notes}`))
    }
  })
  lines.push(line())

  // Subtotal
  lines.push(right(`Subtotal: $${orderData.subtotal.toFixed(2)}`))
  lines.push(right(`IVA (${(businessSettings.tax_rate * 100).toFixed(0)}%): $${orderData.tax.toFixed(2)}`))
  lines.push(line('='))
  lines.push(right(`TOTAL: $${orderData.total.toFixed(2)}`))
  lines.push(line('='))

  // Payment
  if (orderData.paymentMethod) {
    lines.push(`Pago: ${orderData.paymentMethod}`)
    lines.push(right(`Recibido: $${orderData.paymentAmount.toFixed(2)}`))
    if (orderData.change > 0) {
      lines.push(right(`Cambio: $${orderData.change.toFixed(2)}`))
    }
  }

  // Footer
  lines.push('')
  lines.push(center(businessSettings.ticket_footer || 'Gracias por su visita!'))
  lines.push('')

  // Convert to ESC/POS commands
  const encoder = new TextEncoder()
  const commands = []

  // Initialize printer
  commands.push(0x1B, 0x40) // ESC @

  // Set character set (CP437 for Spanish)
  commands.push(0x1B, 0x74, 0x00)

  // Add text lines
  for (const line of lines) {
    const lineBytes = encoder.encode(line + '\n')
    commands.push(...lineBytes)
  }

  // Feed and cut
  commands.push(0x1B, 0x64, 3) // Feed 3 lines
  commands.push(0x1D, 0x56, 0x00) // Full cut

  return Buffer.from(commands)
}

// Simulate printing (for testing without actual printer)
function simulatePrint(receiptData) {
  console.log('=== SIMULATED PRINT ===')
  console.log('Receipt data length:', receiptData.length, 'bytes')
  console.log('========================')
  return { success: true, simulated: true }
}

export function setupPrinterHandlers(mainWindow, db) {
  // List available printers (Windows)
  ipcMain.handle('printer:list', async () => {
    try {
      // On Windows, we can try to list printers via PowerShell
      // For now, return common printer names
      return [
        { name: 'POS-80', type: 'thermal', status: 'available' },
        { name: 'POS-58', type: 'thermal', status: 'available' },
        { name: 'Default', type: 'system', status: 'available' }
      ]
    } catch (error) {
      console.error('Error listing printers:', error)
      return []
    }
  })

  // Print receipt
  ipcMain.handle('printer:print', async (event, { orderData, businessSettings, printerConfig }) => {
    try {
      const config = printerConfig || loadConfig()
      const receiptData = buildReceiptData(orderData, {
        ...businessSettings,
        paper_width: config.paper_width
      })

      // For now, simulate printing
      // In production, this would use escpos library
      const result = simulatePrint(receiptData)

      return { success: true, result }
    } catch (error) {
      console.error('Print error:', error)
      return { success: false, error: error.message }
    }
  })

  // Test printer
  ipcMain.handle('printer:test', async (event, printerConfig) => {
    try {
      const config = printerConfig || loadConfig()
      const testReceipt = {
        orderId: 'TEST-001',
        tableName: 'Mesa 1',
        waiterName: 'Sistema',
        items: [
          { name: 'Ticket de Prueba', quantity: 1, price: 0 }
        ],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'N/A',
        paymentAmount: 0,
        change: 0
      }

      const receiptData = buildReceiptData(testReceipt, {
        business_name: 'PRUEBA DE IMPRESORA',
        ticket_header: '*** TEST ***',
        ticket_footer: 'Impresora funcionando correctamente',
        tax_rate: 0,
        paper_width: config.paper_width
      })

      const result = simulatePrint(receiptData)
      return { success: true, result }
    } catch (error) {
      console.error('Printer test error:', error)
      return { success: false, error: error.message }
    }
  })

  // Get printer config
  ipcMain.handle('printer:getConfig', async () => {
    return loadConfig()
  })

  // Save printer config
  ipcMain.handle('printer:saveConfig', async (event, config) => {
    try {
      saveConfig(config)
      return { success: true }
    } catch (error) {
      console.error('Error saving printer config:', error)
      return { success: false, error: error.message }
    }
  })
}
