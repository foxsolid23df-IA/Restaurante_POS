import { useState, useEffect, useCallback } from 'react'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

export function useReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const fetchReservations = useCallback(async (dateFilters = {}) => {
    if (!currentBranch?.id) {
      setReservations([])
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const rows = await crmApi.getReservations(currentBranch.id, dateFilters)
      setReservations(rows)
      return rows
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const checkTableAvailability = useCallback((tableId, date, duration, reservationId = null) => (
    crmApi.checkTableAvailability({
      tableId,
      reservationDate: date,
      durationMinutes: duration,
      reservationId
    })
  ), [])

  const createReservation = useCallback(async (reservationData) => {
    setLoading(true)
    setError(null)

    try {
      const data = await crmApi.createReservation(reservationData, currentBranch?.id)
      setReservations((prev) => [...prev, data])
      return data
    } catch (err) {
      console.error('Error creating reservation:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const updateReservationStatus = useCallback(async (id, status) => {
    setLoading(true)
    setError(null)

    try {
      const data = await crmApi.updateReservationStatus(id, status)
      setReservations((prev) => prev.map((reservation) => (
        reservation.id === id ? { ...reservation, ...data } : reservation
      )))
      return data
    } catch (err) {
      console.error('Error updating reservation status:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
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
