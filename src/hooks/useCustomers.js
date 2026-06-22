import { useState, useEffect, useCallback } from 'react'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const fetchCustomers = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const rows = await crmApi.getCustomers(currentBranch?.id, filters)
      setCustomers(rows)
      return rows
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const createCustomer = useCallback(async (customerData) => {
    setLoading(true)
    setError(null)

    try {
      const data = await crmApi.saveCustomer(customerData, currentBranch?.id)
      setCustomers((prev) => {
        const exists = prev.some((customer) => customer.id === data.id)
        return exists
          ? prev.map((customer) => (customer.id === data.id ? data : customer))
          : [...prev, data]
      })
      return data
    } catch (err) {
      console.error('Error creating customer:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const updateCustomer = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)

    try {
      const data = await crmApi.saveCustomer({ ...updates, id }, currentBranch?.id)
      setCustomers((prev) => prev.map((customer) => (customer.id === id ? data : customer)))
      return data
    } catch (err) {
      console.error('Error updating customer:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const deleteCustomer = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      const result = await crmApi.deactivateOrDeleteCustomer(id)
      if (result.action === 'deleted') {
        setCustomers((prev) => prev.filter((customer) => customer.id !== id))
      } else {
        setCustomers((prev) => prev.filter((customer) => customer.id !== id))
      }
      return result
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
