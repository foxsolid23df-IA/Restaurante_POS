import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchReservations = useCallback(async (dateFilters = {}) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          customers(name, phone, email),
          tables(name, capacity, area_id)
        `)
        .order('reservation_date', { ascending: true })

      if (dateFilters.startDate) {
        query = query.gte('reservation_date', dateFilters.startDate)
      }
      if (dateFilters.endDate) {
        query = query.lte('reservation_date', dateFilters.endDate)
      }

      const { data, error } = await query

      if (error) throw error
      setReservations(data || [])
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createReservation = useCallback(async (reservationData) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          ...reservationData,
          duration_minutes: reservationData.duration_minutes || 120, // Default 2h
        }])
        .select(`
          *,
          customers(name, phone, email),
          tables(name)
        `)
        .single()

      if (error) throw error
      setReservations(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating reservation:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateReservationStatus = useCallback(async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Si el estado es 'seated', podríamos marcar la mesa como ocupada
      if (status === 'seated' && data.table_id) {
        await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', data.table_id)
      }

      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: data.status } : r))
      return data
    } catch (err) {
      console.error('Error updating reservation status:', err)
      throw err
    }
  }, [])

  // Verificar disponibilidad futura
  const checkTableAvailability = useCallback(async (tableId, date, duration) => {
    try {
      const startTime = new Date(date)
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const { data, error } = await supabase
        .from('reservations')
        .select('reservation_date, duration_minutes')
        .eq('table_id', tableId)
        .not('status', 'eq', 'cancelled')

      if (error) throw error

      const hasConflict = data.some(res => {
        const resStart = new Date(res.reservation_date)
        const resEnd = new Date(resStart.getTime() + (res.duration_minutes || 120) * 60000)
        
        return (startTime < resEnd && endTime > resStart)
      })

      return !hasConflict
    } catch (err) {
      console.error('Error checking availability:', err)
      return false
    }
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  return {
    reservations,
    loading,
    error,
    fetchReservations,
    createReservation,
    updateReservationStatus,
    checkTableAvailability
  }
}

export default useReservations
