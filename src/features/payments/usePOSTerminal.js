import { useState, useEffect, useCallback } from 'react'
import { posTerminal, TERMINAL_TYPES } from './posTerminal'

const STORAGE_KEY = 'pos_terminal_config'

export function usePOSTerminal() {
  const [status, setStatus] = useState(posTerminal.status)
  const [config, setConfigState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : { type: TERMINAL_TYPES.NONE }
    } catch {
      return { type: TERMINAL_TYPES.NONE }
    }
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    return posTerminal.subscribe(setStatus)
  }, [])

  const saveConfig = useCallback((newConfig) => {
    setConfigState(newConfig)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    } catch {}
  }, [])

  const connect = useCallback(async () => {
    try {
      await posTerminal.connect(config)
      return true
    } catch (err) {
      throw err
    }
  }, [config])

  const disconnect = useCallback(async () => {
    await posTerminal.disconnect()
  }, [])

  const processPayment = useCallback(async (amount) => {
    setProcessing(true)
    try {
      const result = await posTerminal.processPayment(amount)
      return result
    } finally {
      setProcessing(false)
    }
  }, [])

  const resetStatus = useCallback(() => {
    posTerminal.resetStatus()
  }, [])

  return {
    status,
    config,
    processing,
    connected: posTerminal.connected,
    type: posTerminal.type,
    saveConfig,
    connect,
    disconnect,
    processPayment,
    resetStatus,
    terminalTypes: TERMINAL_TYPES,
  }
}
