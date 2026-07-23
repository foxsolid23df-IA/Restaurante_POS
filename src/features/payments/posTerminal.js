const TERMINAL_TYPES = {
  NONE: 'none',
  PINPAD_USB: 'pinpad_usb',
  PINPAD_BT: 'pinpad_bt',
  INGENICO: 'ingenico',
  PAX: 'pax',
  VERIFONE: 'verifone',
}

const TERMINAL_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  DECLINED: 'declined',
  ERROR: 'error',
}

class POSTerminalManager {
  constructor() {
    this._status = TERMINAL_STATUS.DISCONNECTED
    this._type = TERMINAL_TYPES.NONE
    this._config = null
    this._listeners = new Set()
  }

  get status() { return this._status }
  get type() { return this._type }
  get connected() { return this._status === TERMINAL_STATUS.CONNECTED }

  subscribe(cb) {
    this._listeners.add(cb)
    return () => this._listeners.delete(cb)
  }

  _notify() {
    this._listeners.forEach((cb) => cb(this._status))
  }

  async connect(config) {
    this._config = config
    this._type = config.type || TERMINAL_TYPES.NONE
    this._status = TERMINAL_STATUS.CONNECTING
    this._notify()

    try {
      await this._connectDevice(config)
      this._status = TERMINAL_STATUS.CONNECTED
      this._notify()
      return true
    } catch (err) {
      this._status = TERMINAL_STATUS.ERROR
      this._notify()
      throw err
    }
  }

  async disconnect() {
    this._status = TERMINAL_STATUS.DISCONNECTED
    this._type = TERMINAL_TYPES.NONE
    this._config = null
    this._notify()
  }

  async processPayment(amount) {
    if (this._status !== TERMINAL_STATUS.CONNECTED) {
      throw new Error('Terminal no conectada')
    }

    this._status = TERMINAL_STATUS.PROCESSING
    this._notify()

    try {
      const result = await this._sendPayment(amount)
      this._status = result.approved ? TERMINAL_STATUS.APPROVED : TERMINAL_STATUS.DECLINED
      this._notify()
      return result
    } catch (err) {
      this._status = TERMINAL_STATUS.ERROR
      this._notify()
      throw err
    }
  }

  async _connectDevice(config) {
    if (config.type === TERMINAL_TYPES.NONE || !config.type) return

    if (config.type === TERMINAL_TYPES.PINPAD_USB) {
      if (!navigator.usb) throw new Error('WebUSB no soportado en este navegador')
      const device = await navigator.usb.requestDevice({ filters: [{ vendorId: config.vendorId || 0xFFFF }] })
      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)
      return device
    }

    if (config.type === TERMINAL_TYPES.PINPAD_BT) {
      if (!navigator.bluetooth) throw new Error('Bluetooth no soportado en este navegador')
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['0000180f-0000-1000-8000-00805f9b34fb'] }],
      })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('0000180f-0000-1000-8000-8000-00805f9b34fb')
      return { device, server, service }
    }

    return null
  }

  async _sendPayment(amount) {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return { approved: true, transactionId: `TXN_${Date.now()}`, amount, message: 'Aprobado' }
  }

  resetStatus() {
    if (this._status === TERMINAL_STATUS.APPROVED || this._status === TERMINAL_STATUS.DECLINED) {
      this._status = this._config ? TERMINAL_STATUS.CONNECTED : TERMINAL_STATUS.DISCONNECTED
      this._notify()
    }
  }
}

export const posTerminal = new POSTerminalManager()
export { TERMINAL_TYPES, TERMINAL_STATUS }
