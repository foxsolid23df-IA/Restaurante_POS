import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBranchStore } from '@/store/branchStore'

export function usePrinters() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const getPrinters = useCallback(async () => {
    if (!currentBranch?.id) return []
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('printers')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name')
      if (error) throw error
      return data
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
      const printerData = {
        ...printer,
        branch_id: currentBranch.id,
        updated_at: new Date().toISOString()
      }

      if (printer.id) {
        const { data, error } = await supabase
          .from('printers')
          .update(printerData)
          .eq('id', printer.id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('printers')
          .insert([printerData])
          .select()
          .single()
        if (error) throw error
        return data
      }
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
      const { error } = await supabase
        .from('printers')
        .delete()
        .eq('id', id)
      if (error) throw error
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
