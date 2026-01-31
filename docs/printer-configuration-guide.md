# Printer Configuration Guide - Restaurant POS System

## Supported Printer Models

### Thermal Printers (Recommended)
- **Epson TM-T88V/VII**: Industry standard for POS
- **Star TSP650II**: Reliable kitchen/bar printer
- **Citizen CT-S3100**: Budget-friendly option
- **Custom POS Thermal**: 80mm paper width

### Configuration Options

## 1. Epson TM-T88V Setup
```javascript
// src/config/epson-config.js
export const EPSON_TM_T88_CONFIG = {
  printer: {
    name: 'Epson TM-T88V',
    type: 'thermal',
    width: 80, // mm
    height: 200, // mm max
    dpi: 203,
    encoding: 'PC860_USA',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
  },
  
  commands: {
    initialize: '\x1B@', // Initialize printer
    cut: '\x1D\x56\x00', // Full cut
    partialCut: '\x1D\x56\x01', // Partial cut
    lineHeight: 32, // dots per line
    feedLines: 3, // lines to feed after print
    emphasize: '\x1BE', // Emphasize text
    doubleWidth: '\x1W\x01', // Double width
    doubleHeight: '\x1B\x0E', // Double height
    alignLeft: '\x1Ba\x00',
    alignCenter: '\x1Ba\x01',
    alignRight: '\x1Ba\x02'
  }
}
```

## 2. Star Micronics Setup
```javascript
// src/config/star-config.js
export const STAR_TSP_CONFIG = {
  printer: {
    name: 'Star TSP650II',
    type: 'thermal',
    width: 80, // mm
    encoding: 'PC860_USA',
    interface: 'USB'
  },
  
  commands: {
    initialize: '\x1B\x40',
    cut: '\x1B\x64\x02', // Feed and cut
    lineHeight: 33,
    fontA: '\x1B\x21\x00',
    fontB: '\x1B\x21\x01',
    alignLeft: '\x1B\x61\x00',
    alignCenter: '\x1B\x61\x01',
    alignRight: '\x1B\x61\x02'
  }
}
```

## 3. Network Printer Configuration
```javascript
// src/printer/network-printer.js
export class NetworkPrinter {
  constructor(config) {
    this.config = config
    this.ip = config.ipAddress
    this.port = config.port || 9100
    this.timeout = config.timeout || 5000
  }

  async connect() {
    try {
      this.socket = new WebSocket(`ws://${this.ip}:${this.port}`)
      
      return new Promise((resolve, reject) => {
        this.socket.onopen = () => {
          console.log(`🖨️ Connected to printer at ${this.ip}`)
          resolve(true)
        }
        
        this.socket.onerror = (error) => {
          console.error('❌ Printer connection failed:', error)
          reject(error)
        }
        
        setTimeout(() => {
          reject(new Error('Printer connection timeout'))
        }, this.timeout)
      })
    } catch (error) {
      throw new Error(`Failed to connect to printer: ${error.message}`)
    }
  }

  async print(comanda) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Printer not connected')
    }

    try {
      const printData = this.formatComanda(comanda)
      this.socket.send(printData)
      
      // Wait for print completion
      await this.waitForPrintComplete()
      
      console.log('✅ Comanda printed successfully')
      return true
    } catch (error) {
      console.error('❌ Print failed:', error)
      throw error
    }
  }

  formatComanda(comanda) {
    const { commands } = this.config
    
    let output = commands.initialize
    output += commands.alignCenter
    output += commands.doubleHeight
    output += '🍽️ COMANDA RESTAURANTE 🍽️\n'
    output += commands.doubleHeight + commands.alignLeft
    output += '═'.repeat(48) + '\n\n'
    
    // Order info
    output += `Mesa: ${comanda.table_name}\n`
    output += `Área: ${comanda.area_name}\n`
    output += `Hora: ${new Date(comanda.created_at).toLocaleTimeString()}\n`
    output += `Orden: ${comanda.order_id}\n\n`
    
    if (comanda.customer_info) {
      output += `Cliente: ${comanda.customer_info.name}\n`
    }
    
    output += '─'.repeat(48) + '\n\n'
    
    // Items
    output += commands.alignLeft
    comanda.items.forEach((item, index) => {
      output += `${index + 1}. ${item.name}\n`
      output += `   ${item.quantity}x ${item.category}\n`
      
      if (item.notes) {
        output += `   📝 ${item.notes}\n`
      }
      
      if (item.modifiers && item.modifiers.length > 0) {
        output += `   +${item.modifiers.join(', ')}\n`
      }
      
      output += '\n'
    })
    
    output += '─'.repeat(48) + '\n'
    
    // Total items
    const totalItems = comanda.items.reduce((sum, item) => sum + item.quantity, 0)
    output += `Total Items: ${totalItems}\n`
    
    // Priority
    if (comanda.priority === 'urgent') {
      output += commands.emphasize
      output += '\n⚡ URGENTE ⚡\n'
      output += commands.emphasize + '\n'
    }
    
    output += '\n'
    output += commands.cut
    
    return output
  }

  async waitForPrintComplete() {
    return new Promise(resolve => {
      setTimeout(resolve, 2000) // 2 seconds for print to complete
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      console.log('🔌 Printer disconnected')
    }
  }
}
```

## 4. USB Printer Configuration
```javascript
// src/printer/usb-printer.js
export class USBPrinter {
  constructor(config) {
    this.config = config
    this.device = null
  }

  async initialize() {
    try {
      // Request USB device access
      const devices = await navigator.usb.getDevices()
      
      // Find compatible printer
      this.device = devices.find(device => 
        device.vendorId === this.config.vendorId &&
        device.productId === this.config.productId
      )
      
      if (!this.device) {
        // Request device if not found
        this.device = await navigator.usb.requestDevice({
          filters: [{
            vendorId: this.config.vendorId,
            productId: this.config.productId
          }]
        })
      }
      
      await this.device.open()
      await this.device.claimInterface(0)
      
      console.log('🖨️ USB printer initialized')
      return true
    } catch (error) {
      console.error('❌ USB printer initialization failed:', error)
      throw error
    }
  }

  async print(comanda) {
    try {
      const printData = this.formatComanda(comanda)
      
      // Send data in chunks if needed
      const chunkSize = 64 // USB endpoint max size
      const chunks = []
      
      for (let i = 0; i < printData.length; i += chunkSize) {
        chunks.push(printData.slice(i, i + chunkSize))
      }
      
      // Send chunks
      for (const chunk of chunks) {
        await this.device.transferOut(1, new TextEncoder().encode(chunk))
      }
      
      console.log('✅ USB print sent successfully')
      return true
    } catch (error) {
      console.error('❌ USB print failed:', error)
      throw error
    }
  }
}
```

## 5. Printer Management Interface
```javascript
// src/printer/printerManager.js
export class PrinterManager {
  constructor() {
    this.printers = new Map()
    this.activeConnections = new Map()
  }

  async addPrinter(printerConfig) {
    const printer = this.createPrinter(printerConfig)
    
    try {
      await printer.connect()
      this.printers.set(printerConfig.id, printer)
      this.activeConnections.set(printerConfig.id, true)
      
      console.log(`✅ Printer ${printerConfig.name} added and connected`)
      return true
    } catch (error) {
      console.error(`❌ Failed to add printer ${printerConfig.name}:`, error)
      return false
    }
  }

  createPrinter(config) {
    switch (config.type) {
      case 'network':
        return new NetworkPrinter(config)
      case 'usb':
        return new USBPrinter(config)
      case 'bluetooth':
        return new BluetoothPrinter(config)
      default:
        throw new Error(`Unsupported printer type: ${config.type}`)
    }
  }

  async printToArea(area, comanda) {
    const areaPrinters = this.getPrintersByArea(area)
    
    if (areaPrinters.length === 0) {
      throw new Error(`No printers configured for area: ${area}`)
    }

    const printPromises = areaPrinters.map(async (printerId) => {
      const printer = this.printers.get(printerId)
      if (printer) {
        try {
          await printer.print(comanda)
          return { printerId, success: true }
        } catch (error) {
          console.error(`Print failed on ${printerId}:`, error)
          return { printerId, success: false, error }
        }
      }
    })

    const results = await Promise.allSettled(printPromises)
    return results
  }

  getPrintersByArea(area) {
    const printers = []
    
    this.printers.forEach((printer, id) => {
      if (printer.config.area === area && this.activeConnections.get(id)) {
        printers.push(id)
      }
    })
    
    return printers
  }

  async testPrinter(printerId) {
    const printer = this.printers.get(printerId)
    if (!printer) {
      throw new Error('Printer not found')
    }

    const testComanda = {
      id: 'TEST_' + Date.now(),
      table_name: 'MESA PRUEBA',
      area_name: 'ÁREA PRUEBA',
      items: [
        {
          name: 'Item de Prueba',
          quantity: 1,
          category: 'Test',
          notes: 'Comanda de prueba'
        }
      ],
      created_at: new Date().toISOString(),
      priority: 'normal'
    }

    try {
      await printer.print(testComanda)
      return { success: true, message: 'Test print successful' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async getPrinterStatus(printerId) {
    const printer = this.printers.get(printerId)
    if (!printer) {
      return { status: 'not_found' }
    }

    try {
      const connected = this.activeConnections.get(printerId)
      return {
        id: printerId,
        status: connected ? 'online' : 'offline',
        lastCheck: new Date().toISOString()
      }
    } catch (error) {
      return {
        id: printerId,
        status: 'error',
        error: error.message,
        lastCheck: new Date().toISOString()
      }
    }
  }

  disconnectAll() {
    this.printers.forEach((printer, id) => {
      try {
        printer.disconnect()
        this.activeConnections.set(id, false)
      } catch (error) {
        console.error(`Error disconnecting printer ${id}:`, error)
      }
    })
  }
}
```

## 6. Configuration Templates

### Kitchen Printers
```json
{
  "kitchen_printers": [
    {
      "id": "kitchen_main",
      "name": "Cocina Principal",
      "area": "kitchen",
      "type": "network",
      "ipAddress": "192.168.1.100",
      "port": 9100,
      "width": 80,
      "autoCut": true,
      "enabled": true
    },
    {
      "id": "kitchen_grill",
      "name": "Parrilla",
      "area": "kitchen",
      "type": "usb",
      "vendorId": 1208,
      "productId": 3456,
      "width": 80,
      "autoCut": true,
      "enabled": true
    }
  ]
}
```

### Bar Printers
```json
{
  "bar_printers": [
    {
      "id": "bar_main",
      "name": "Bar Principal",
      "area": "bar",
      "type": "network",
      "ipAddress": "192.168.1.101",
      "port": 9100,
      "width": 58,
      "autoCut": true,
      "enabled": true
    }
  ]
}
```

### General/Receipt Printers
```json
{
  "receipt_printers": [
    {
      "id": "receipt_main",
      "name": "Ticket Principal",
      "area": "general",
      "type": "usb",
      "vendorId": 8456,
      "productId": 1234,
      "width": 80,
      "autoCut": true,
      "enabled": true
    }
  ]
}
```