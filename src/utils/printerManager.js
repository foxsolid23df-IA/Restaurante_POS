// src/utils/printerManager.js
export class PrinterManager {
  constructor() {
    this.printers = new Map()
    this.defaultPrinter = null
  }

  // ESC/POS Commands for Thermal Printers
  get escPosCommands() {
    return {
      initialize: '\x1B\x40',                    // Initialize printer
      center: '\x1B\x61\x01',                  // Center align
      left: '\x1B\x61\x00',                   // Left align
      right: '\x1B\x61\x02',                  // Right align
      bold: '\x1B\x45\x01',                    // Bold on
      boldOff: '\x1B\x45\x00',                 // Bold off
      underline: '\x1B\x2D\x01',                // Underline on
      underlineOff: '\x1B\x2D\x00',             // Underline off
      lineFeed: '\x0A',                         // Line feed
      formFeed: '\x0C',                         // Form feed
      cut: '\x1D\x56\x41',                       // Paper cut
      partialCut: '\x1D\x56\x42',                // Partial cut
      fontSize: '\x1D\x21',                     // Font size command
      invert: '\x1B\x42\x01',                   // Inverse on
      invertOff: '\x1B\x42\x00',                // Inverse off
      barcode: '\x1D\x6B',                     // Barcode command
      qrcode: '\x1D\x28\x6B',                   // QR code command
      image: '\x1D\x76\x30\x00'                // Image command
    }
  }

  // Formatear texto para impresión
  formatText(text, options = {}) {
    const esc = this.escPosCommands
    let result = ''
    
    // Aplicar alineación
    if (options.align === 'center') result += esc.center
    else if (options.align === 'right') result += esc.right
    else result += esc.left
    
    // Aplicar negrita
    if (options.bold) result += esc.bold
    
    // Aplicar subrayado
    if (options.underline) result += esc.underline
    
    // Agregar texto
    result += text
    
    // Limpiar formatos
    if (options.bold) result += esc.boldOff
    if (options.underline) result += esc.underlineOff
    
    result += esc.lineFeed
    
    return result
  }

  // Generar línea divisoria
  generateDivider() {
    return '-'.repeat(32) + '\n'
  }

  // Generar comanda completa
  generateComanda(comanda) {
    const esc = this.escPosCommands
    let output = ''
    
    // Header de la comanda
    output += esc.initialize
    output += this.formatText('🍽️ COMANDA - RESTAURANTE', { align: 'center', bold: true })
    output += this.generateDivider()
    
    // Información de la orden
    output += this.formatText(`Mesa: ${comanda.table_name}`, { bold: true })
    output += this.formatText(`Área: ${comanda.area_name}`)
    output += this.formatText(`Hora: ${new Date(comanda.created_at).toLocaleTimeString()}`)
    output += this.formatText(`Orden: #${comanda.order_id}`)
    
    if (comanda.customer_info?.name) {
      output += this.formatText(`Cliente: ${comanda.customer_info.name}`)
    }
    
    output += this.generateDivider()
    
    // Items de la orden
    output += this.formatText('ITEMS DE LA COMANDA:', { bold: true })
    output += this.generateDivider()
    
    comanda.items.forEach((item, index) => {
      output += this.formatText(`${index + 1}. ${item.name}`, { bold: true })
      output += this.formatText(`   ${item.quantity}x ${item.category}`)
      
      if (item.notes) {
        output += this.formatText(`   📝 ${item.notes}`)
      }
      
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          output += this.formatText(`   + ${modifier}`)
        })
      }
      
      output += this.formatText('') // Espacio entre items
    })
    
    output += this.generateDivider()
    
    // Resumen
    const totalItems = comanda.items.reduce((sum, item) => sum + item.quantity, 0)
    output += this.formatText(`Total Items: ${totalItems}`)
    output += this.formatText(`Prioridad: ${comanda.priority === 'urgent' ? '⚡ URGENTE' : '🕐 Normal'}`)
    
    if (comanda.notes) {
      output += this.generateDivider()
      output += this.formatText('NOTAS ESPECIALES:', { bold: true })
      output += this.formatText(comanda.notes)
    }
    
    output += this.generateDivider()
    output += this.formatText('✅ COMANDA IMPRESA', { align: 'center' })
    
    // Cortar papel
    output += esc.partialCut
    
    return output
  }

  // Imprimir comanda por red
  async printNetwork(printer, data) {
    try {
      const response = await fetch(`http://${printer.ip}:${printer.port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': new Blob([data]).size
        },
        body: data,
        timeout: 10000
      })
      
      if (response.ok) {
        return { success: true, message: 'Print sent successfully' }
      } else {
        return { success: false, error: 'Printer responded with error' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Imprimir por USB
  async printUSB(printer, data) {
    if (!navigator.usb) {
      return { success: false, error: 'USB Web API not supported' }
    }
    
    try {
      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: printer.vendorId }]
      })
      
      await device.open()
      await device.claimInterface(0)
      
      // Enviar datos a la impresora
      const encoder = new TextEncoder()
      await device.transferOut(1, encoder.encode(data))
      
      await device.releaseInterface(0)
      await device.close()
      
      return { success: true, message: 'Print sent successfully via USB' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Imprimir por Bluetooth
  async printBluetooth(printer, data) {
    if (!navigator.bluetooth) {
      return { success: false, error: 'Bluetooth Web API not supported' }
    }
    
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: printer.name }]
      })
      
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(0x49535)
      const characteristic = await service.getCharacteristic(0x49536)
      
      const encoder = new TextEncoder()
      await characteristic.writeValue(encoder.encode(data))
      
      server.disconnect()
      
      return { success: true, message: 'Print sent successfully via Bluetooth' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Imprimir comanda automáticamente
  async printComanda(comanda, printer = null) {
    const targetPrinter = printer || this.defaultPrinter
    
    if (!targetPrinter) {
      return { success: false, error: 'No printer selected' }
    }
    
    const printData = this.generateComanda(comanda)
    
    try {
      let result
      
      switch (targetPrinter.type) {
        case 'network':
          result = await this.printNetwork(targetPrinter, printData)
          break
        case 'usb':
          result = await this.printUSB(targetPrinter, printData)
          break
        case 'bluetooth':
          result = await this.printBluetooth(targetPrinter, printData)
          break
        default:
          result = { success: false, error: 'Unsupported printer type' }
      }
      
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Imprimir ticket de venta
  generateSalesTicket(order) {
    const esc = this.escPosCommands
    let output = ''
    
    // Header
    output += esc.initialize
    output += this.formatText('TICKET DE VENTA', { align: 'center', bold: true })
    output += this.generateDivider()
    
    // Info del restaurante
    output += this.formatText('RESTAURANTE ABC', { align: 'center' })
    output += this.formatText('RFC: ABC123456XYZ', { align: 'center' })
    output += this.formatText('Dirección: Calle Principal #123', { align: 'center' })
    output += this.formatText('Tel: (555) 123-4567', { align: 'center' })
    output += this.generateDivider()
    
    // Info de la venta
    output += this.formatText(`Ticket: #${order.id}`)
    output += this.formatText(`Fecha: ${new Date(order.created_at).toLocaleString()}`)
    output += this.formatText(`Mesa: ${order.table_name}`)
    output += this.generateDivider()
    
    // Items vendidos
    order.items.forEach(item => {
      output += this.formatText(`${item.name}`)
      output += this.formatText(`   ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`)
    })
    
    output += this.generateDivider()
    
    // Totales
    const subtotal = order.total_amount / 1.16
    const tax = order.total_amount - subtotal
    
    output += this.formatText(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' })
    output += this.formatText(`IVA (16%): $${tax.toFixed(2)}`, { align: 'right' })
    output += this.formatText(`TOTAL: $${order.total_amount.toFixed(2)}`, { align: 'right', bold: true })
    
    // Método de pago
    output += this.generateDivider()
    output += this.formatText(`Pago: ${order.payment_method}`)
    
    if (order.payment_method === 'cash') {
      const change = order.cash_received - order.total_amount
      output += this.formatText(`Recibido: $${order.cash_received.toFixed(2)}`)
      output += this.formatText(`Cambio: $${change.toFixed(2)}`)
    }
    
    output += this.generateDivider()
    
    // Footer
    output += this.formatText('¡Gracias por su visita!', { align: 'center' })
    output += this.formatText('Lo esperamos pronto', { align: 'center' })
    
    output += esc.partialCut
    
    return output
  }

  // Agregar impresora
  addPrinter(printer) {
    this.printers.set(printer.id, printer)
    if (!this.defaultPrinter) {
      this.defaultPrinter = printer
    }
  }

  // Establecer impresora por defecto
  setDefaultPrinter(printerId) {
    const printer = this.printers.get(printerId)
    if (printer) {
      this.defaultPrinter = printer
      return true
    }
    return false
  }

  // Obtener lista de impresoras
  getPrinters() {
    return Array.from(this.printers.values())
  }

  // Probar impresora
  async testPrinter(printer) {
    const testData = this.formatText('PRINTER TEST', { align: 'center', bold: true })
    testData += this.generateDivider()
    testData += this.formatText(`Printer: ${printer.name}`)
    testData += this.formatText(`Type: ${printer.type}`)
    testData += this.formatText(`Model: ${printer.model}`)
    testData += this.formatText(`Date: ${new Date().toLocaleString()}`)
    testData += this.generateDivider()
    testData += this.formatText('TEST OK', { align: 'center' })
    testData += this.escPosCommands.partialCut
    
    return this.printComanda({ items: [], table_name: 'Test' }, printer)
  }
}

export default new PrinterManager()