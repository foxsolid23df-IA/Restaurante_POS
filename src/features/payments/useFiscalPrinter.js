import { useState, useEffect, useCallback } from 'react'
import { fiscalPrinter, FISCAL_PRINTER_TYPES } from './fiscalPrinter'

const STORAGE_KEY = 'fiscal_printer_config'

export function useFiscalPrinter() {
  const [status, setStatus] = useState(fiscalPrinter.status)
  const [config, setConfigState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : { type: FISCAL_PRINTER_TYPES.NONE }
    } catch {
      return { type: FISCAL_PRINTER_TYPES.NONE }
    }
  })
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    return fiscalPrinter.subscribe(setStatus)
  }, [])

  const saveConfig = useCallback((newConfig) => {
    setConfigState(newConfig)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    } catch {}
  }, [])

  const connect = useCallback(async () => {
    try {
      await fiscalPrinter.connect(config)
      return true
    } catch (err) {
      throw err
    }
  }, [config])

  const disconnect = useCallback(async () => {
    await fiscalPrinter.disconnect()
  }, [])

  const printReceipt = useCallback(async (data) => {
    setPrinting(true)
    try {
      const result = await fiscalPrinter.printFiscalReceipt(data)
      return result
    } finally {
      setPrinting(false)
    }
  }, [])

  const openDrawer = useCallback(async () => {
    await fiscalPrinter.openCashDrawer()
  }, [])

  const printReport = useCallback(async (type, data) => {
    setPrinting(true)
    try {
      await fiscalPrinter.printReport(type, data)
    } finally {
      setPrinting(false)
    }
  }, [])

  return {
    status,
    config,
    printing,
    connected: fiscalPrinter.connected,
    type: fiscalPrinter.type,
    saveConfig,
    connect,
    disconnect,
    printReceipt,
    openDrawer,
    printReport,
    printerTypes: FISCAL_PRINTER_TYPES,
  }
}
