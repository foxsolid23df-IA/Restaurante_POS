import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createCustomer = useCallback(async (customerData) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single()

      if (error) throw error
      setCustomers(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating customer:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCustomer = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setCustomers(prev => prev.map(c => c.id === id ? data : c))
      return data
    } catch (err) {
      console.error('Error updating customer:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCustomer = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCustomers(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error deleting customer:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}

export default useCustomers
