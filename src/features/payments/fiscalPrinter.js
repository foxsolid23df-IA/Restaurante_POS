const FISCAL_PRINTER_TYPES = {
  NONE: 'none',
  HIKARI: 'hikari',
  HASAR: 'hasar',
  EPSON_FISCAL: 'epson_fiscal',
  IBM: 'ibm_fiscal',
  GENERIC_ESC_POS: 'generic_esc_pos',
}

const FISCAL_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  PRINTING: 'printing',
  ERROR: 'error',
  PAPER_OUT: 'paper_out',
  OPEN_DRAWER: 'open_drawer',
}

class FiscalPrinterManager {
  constructor() {
    this._status = FISCAL_STATUS.DISCONNECTED
    this._type = FISCAL_PRINTER_TYPES.NONE
    this._config = null
    this._listeners = new Set()
  }

  get status() { return this._status }
  get type() { return this._type }
  get connected() { return this._status === FISCAL_STATUS.CONNECTED }

  subscribe(cb) {
    this._listeners.add(cb)
    return () => this._listeners.delete(cb)
  }

  _notify() {
    this._listeners.forEach((cb) => cb(this._status))
  }

  _setStatus(newStatus) {
    this._status = newStatus
    this._notify()
  }

  async connect(config) {
    this._config = config
    this._type = config.type || FISCAL_PRINTER_TYPES.NONE
    this._setStatus(FISCAL_STATUS.CONNECTING)

    try {
      await this._connectDevice(config)
      this._setStatus(FISCAL_STATUS.CONNECTED)
      return true
    } catch (err) {
      this._setStatus(FISCAL_STATUS.ERROR)
      throw err
    }
  }

  async disconnect() {
    this._setStatus(FISCAL_STATUS.DISCONNECTED)
    this._type = FISCAL_PRINTER_TYPES.NONE
    this._config = null
  }

  async _connectDevice(config) {
    if (config.type === FISCAL_PRINTER_TYPES.NONE || !config.type) return

    if (config.type === FISCAL_PRINTER_TYPES.GENERIC_ESC_POS || config.type === FISCAL_PRINTER_TYPES.HIKARI) {
      if (config.connection === 'usb' && navigator.usb) {
        const device = await navigator.usb.requestDevice({
          filters: [{ vendorId: config.vendorId || 0xFFFF }],
        })
        await device.open()
        await device.selectConfiguration(1)
        await device.claimInterface(0)
        return device
      }
      if (config.connection === 'bluetooth' && navigator.bluetooth) {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        })
        const server = await device.gatt.connect()
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-8000-00805f9b34fb')
        return { device, server, service }
      }
      if (config.connection === 'network' || config.connection === 'serial') {
        return { type: config.connection, host: config.host, port: config.port }
      }
      throw new Error('Conexión no soportada para esta impresora')
    }

    return null
  }

  async _sendCommand(command) {
    if (!this._config) throw new Error('Impresora fiscal no configurada')
    await new Promise((resolve) => setTimeout(resolve, 500))
    return true
  }

  async printFiscalReceipt(data) {
    if (!this.connected) throw new Error('Impresora fiscal no conectada')
    this._setStatus(FISCAL_STATUS.PRINTING)

    try {
      const commands = this._buildFiscalCommands(data)
      for (const cmd of commands) {
        await this._sendCommand(cmd)
      }
      this._setStatus(FISCAL_STATUS.CONNECTED)
      return true
    } catch (err) {
      this._setStatus(FISCAL_STATUS.ERROR)
      throw err
    }
  }

  _buildFiscalCommands(data) {
    const cmds = []
    cmds.push({ type: 'openFiscalReceipt', data: { rfc: data.rfc || '' } })

    data.items.forEach((item) => {
      cmds.push({
        type: 'printLineItem',
        data: {
          description: item.description,
          quantity: item.quantity,
          price: item.unitPrice,
          taxRate: item.taxRate || 0.16,
        },
      })
    })

    cmds.push({ type: 'printSubtotal', data: {} })
    cmds.push({ type: 'printTotal', data: { amount: data.total } })

    const paymentTypes = {
      cash: '01',
      card: '02',
      transfer: '03',
      digital_wallet: '04',
    }

    cmds.push({
      type: 'printPayment',
      data: { amount: data.total, code: paymentTypes[data.paymentMethod] || '01' },
    })

    cmds.push({ type: 'closeFiscalReceipt', data: {} })
    return cmds
  }

  async openCashDrawer() {
    await this._sendCommand({ type: 'openDrawer', data: {} })
    this._setStatus(FISCAL_STATUS.OPEN_DRAWER)
    setTimeout(() => {
      if (this._status === FISCAL_STATUS.OPEN_DRAWER) {
        this._setStatus(FISCAL_STATUS.CONNECTED)
      }
    }, 3000)
  }

  async printReport(type, data = {}) {
    if (!this.connected) throw new Error('Impresora fiscal no conectada')
    this._setStatus(FISCAL_STATUS.PRINTING)

    try {
      const reports = {
        x: [{ type: 'printXReport', data }],
        z: [{ type: 'printZReport', data }],
        daily: [{ type: 'printDailyReport', data }],
      }
      const commands = reports[type] || []
      for (const cmd of commands) {
        await this._sendCommand(cmd)
      }
      this._setStatus(FISCAL_STATUS.CONNECTED)
      return true
    } catch (err) {
      this._setStatus(FISCAL_STATUS.ERROR)
      throw err
    }
  }
}

export const fiscalPrinter = new FiscalPrinterManager()
export { FISCAL_PRINTER_TYPES, FISCAL_STATUS }
