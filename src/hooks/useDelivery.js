import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useDelivery() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deliveries, setDeliveries] = useState([])

  const fetchDeliveries = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      let query = supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders(*),
          customer:customers(*),
          driver:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('delivery_status', filters.status)
      if (filters.driver_id) query = query.eq('driver_id', filters.driver_id)

      const { data, error } = await query
      if (error) throw error
      setDeliveries(data || [])
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createDelivery = useCallback(async (deliveryData) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .insert([deliveryData])
        .select()
        .single()
      if (error) throw error
      setDeliveries(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDeliveryStatus = useCallback(async (deliveryId, status, additionalData = {}) => {
    setLoading(true)
    try {
      const updates = { 
        delivery_status: status, 
        updated_at: new Date().toISOString(),
        ...additionalData 
      }
      
      if (status === 'delivered') updates.actual_delivery_time = new Date().toISOString()

      const { data, error } = await supabase
        .from('delivery_orders')
        .update(updates)
        .eq('id', deliveryId)
        .select()
        .single()
      
      if (error) throw error
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, ...data } : d))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const assignDriver = useCallback(async (deliveryId, driverId) => {
    return updateDeliveryStatus(deliveryId, 'preparing', { driver_id: driverId })
  }, [updateDeliveryStatus])

  useEffect(() => {
    fetchDeliveries()
    
    // Real-time subscription
    const channel = supabase
      .channel('delivery_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_orders' }, payload => {
        fetchDeliveries()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDeliveries])

  return {
    loading,
    error,
    deliveries,
    fetchDeliveries,
    createDelivery,
    updateDeliveryStatus,
    assignDriver
  }
}
