import { useComandaPrinter } from '@/hooks/useComandaPrinter'

export class PrinterDetector {
  constructor() {
    this.printers = []
    this.scanning = false
  }

  async scanNetworkPrinters() {
    this.scanning = true
    const discoveredPrinters = []
    
    // Escanear rangos de IP comunes
    const ipRanges = [
      '192.168.1.100-150',
      '192.168.0.100-150', 
      '10.0.0.100-150'
    ]

    for (const range of ipRanges) {
      const match = range.match(/(\d+\.\d+\.\d+)\.(\d+)-(\d+)/)
      if (!match) continue
      const [base, start, end] = match.slice(1)
      
      for (let i = parseInt(start); i <= parseInt(end); i++) {
        const ip = `${base}.${i}`
        
        try {
          // Intentar conexión al puerto 9100 (standard printer port)
          const response = await this.testPrinterConnection(ip, 9100)
          
          if (response.success) {
            discoveredPrinters.push({
              id: `printer_${i}`,
              name: `Network Printer ${ip}`,
              ip,
              port: 9100,
              type: 'network',
              model: response.model || 'Unknown',
              paperSize: '80mm',
              status: 'connected'
            })
          }
        } catch (error) {
          // Silently continue
        }
      }
    }

    this.scanning = false
    this.printers = discoveredPrinters
    return discoveredPrinters
  }

  async testPrinterConnection(ip, port) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      // Nota: Fetch directo a una IP en puerto 9100 puede fallar debido a CORS 
      // o porque el navegador no permite peticiones mixed content / raw sockets.
      // Esta es una implementación simplificada.
      const response = await fetch(`http://${ip}:${port}`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return { success: true, model: 'Generic POS Printer' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async detectUSBPrinters() {
    if (navigator.usb) {
      try {
        const devices = await navigator.usb.getDevices()
        
        return devices.filter(device => 
          device.productName?.toLowerCase().includes('printer') ||
          device.productName?.toLowerCase().includes('pos')
        ).map(device => ({
          id: device.productName || 'USB Printer',
          name: device.productName || 'USB Printer',
          type: 'usb',
          deviceId: device.deviceId,
          model: device.productName || 'Generic',
          paperSize: '80mm',
          status: 'connected'
        }))
      } catch (error) {
        console.error('USB printer detection failed:', error)
        return []
      }
    }
    
    return []
  }

  async detectBluetoothPrinters() {
    if ('bluetooth' in navigator) {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalFilters: [
            { namePrefix: 'Printer' },
            { namePrefix: 'POS' }
          ]
        })
        
        return [{
          id: `bt_${device.id}`,
          name: device.name,
          type: 'bluetooth',
          deviceId: device.id,
          model: device.name,
          paperSize: '80mm',
          status: 'connected'
        }]
      } catch (error) {
        console.error('Bluetooth printer detection failed:', error)
        return []
      }
    }
    
    return []
  }
}

export default new PrinterDetector()