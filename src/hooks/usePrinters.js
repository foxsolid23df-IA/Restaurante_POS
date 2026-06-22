import { useState, useCallback } from 'react'
import { useBranchStore } from '@/store/branchStore'
import { settingsApi } from '@/features/settings/api/settingsApi'

export function usePrinters() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const getPrinters = useCallback(async () => {
    if (!currentBranch?.id) return []
    setLoading(true)
    try {
      return settingsApi.getPrinters(currentBranch.id)
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentBranch])

  const savePrinter = useCallback(async (printer) => {
    setLoading(true)
    try {
      return settingsApi.savePrinter(printer, currentBranch?.id)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch])

  const deletePrinter = useCallback(async (id) => {
    setLoading(true)
    try {
      await settingsApi.deactivatePrinter(id)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getPrinters,
    savePrinter,
    deletePrinter
  }
}
