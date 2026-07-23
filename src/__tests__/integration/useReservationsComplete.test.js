import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReservations } from '@/hooks/useReservations'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn(),
}))

vi.mock('@/features/crm/api/crmApi', () => ({
  crmApi: {
    getReservations: vi.fn(),
    createReservation: vi.fn(),
    updateReservationStatus: vi.fn(),
    checkTableAvailability: vi.fn(),
  },
}))

describe('useReservations - Complete Integration', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({ currentBranch: { id: 'br-1' } })
    crmApi.getReservations.mockResolvedValue([])
    vi.clearAllMocks()
  })

  describe('fetchReservations', () => {
    it('should return empty array when no branch selected', async () => {
      useBranchStore.mockReturnValue({ currentBranch: null })
      const { result } = renderHook(() => useReservations())
      await act(async () => {
        const res = await result.current.fetchReservations()
        expect(res).toEqual([])
      })
      expect(crmApi.getReservations).not.toHaveBeenCalled()
    })

    it('should fetch reservations with branch id', async () => {
      const mockReservations = [
        { id: 'res-1', customer_name: 'Juan', reservation_date: '2026-07-01', status: 'pending' },
        { id: 'res-2', customer_name: 'Maria', reservation_date: '2026-07-02', status: 'confirmed' },
      ]
      crmApi.getReservations.mockResolvedValue(mockReservations)

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        const res = await result.current.fetchReservations({ date: '2026-07-01' })
        expect(res).toEqual(mockReservations)
      })

      expect(crmApi.getReservations).toHaveBeenCalledWith('br-1', { date: '2026-07-01' })
      expect(result.current.reservations).toEqual(mockReservations)
    })

    it('should handle fetch errors', async () => {
      crmApi.getReservations.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        const res = await result.current.fetchReservations()
        expect(res).toEqual([])
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.reservations).toEqual([])
    })

    it('should set loading state during fetch', async () => {
      let resolveFetch
      crmApi.getReservations.mockImplementation(() =>
        new Promise((resolve) => { resolveFetch = resolve })
      )

      const { result } = renderHook(() => useReservations())
      act(() => {
        result.current.fetchReservations()
      })
      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolveFetch([])
      })
      expect(result.current.loading).toBe(false)
    })
  })

  describe('createReservation', () => {
    it('should create reservation and add to list', async () => {
      const existingRes = [{ id: 'res-1', customer_name: 'Juan' }]
      crmApi.getReservations.mockResolvedValue(existingRes)

      const newReservation = {
        customer_id: 'cust-1',
        reservation_date: '2026-07-15T20:00:00',
        table_id: 'tbl-3',
        party_size: 4,
      }
      const createdReservation = { id: 'res-2', ...newReservation, status: 'pending' }
      crmApi.createReservation.mockResolvedValue(createdReservation)

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        await result.current.fetchReservations()
      })

      await act(async () => {
        const res = await result.current.createReservation(newReservation)
        expect(res).toEqual(createdReservation)
      })

      expect(crmApi.createReservation).toHaveBeenCalledWith(newReservation, 'br-1')
      expect(result.current.reservations).toHaveLength(2)
      expect(result.current.reservations).toContainEqual(createdReservation)
    })

    it('should throw and set error on create failure', async () => {
      crmApi.createReservation.mockRejectedValue(new Error('Table not available'))

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        try {
          await result.current.createReservation({ table_id: 'tbl-1' })
        } catch (err) {
          expect(err.message).toBe('Table not available')
        }
      })

      expect(result.current.error).toBe('Table not available')
    })

    it('should set loading state during create', async () => {
      let resolveCreate
      crmApi.createReservation.mockImplementation(() =>
        new Promise((resolve) => { resolveCreate = resolve })
      )

      const { result } = renderHook(() => useReservations())
      act(() => {
        result.current.createReservation({ table_id: 'tbl-1' })
      })
      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolveCreate({ id: 'res-new', status: 'pending' })
      })
      expect(result.current.loading).toBe(false)
    })
  })

  describe('updateReservationStatus', () => {
    it('should update status of existing reservation', async () => {
      const existingRes = [
        { id: 'res-1', customer_name: 'Juan', status: 'pending' },
        { id: 'res-2', customer_name: 'Maria', status: 'confirmed' },
      ]
      crmApi.getReservations.mockResolvedValue(existingRes)

      const updatedReservation = { id: 'res-1', status: 'confirmed' }
      crmApi.updateReservationStatus.mockResolvedValue(updatedReservation)

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        await result.current.fetchReservations()
      })

      await act(async () => {
        const res = await result.current.updateReservationStatus('res-1', 'confirmed')
        expect(res).toEqual(updatedReservation)
      })

      expect(crmApi.updateReservationStatus).toHaveBeenCalledWith('res-1', 'confirmed')
      const updated = result.current.reservations.find((r) => r.id === 'res-1')
      expect(updated.status).toBe('confirmed')
      const unchanged = result.current.reservations.find((r) => r.id === 'res-2')
      expect(unchanged.status).toBe('confirmed')
    })

    it('should throw and set error on update failure', async () => {
      crmApi.updateReservationStatus.mockRejectedValue(new Error('Invalid status transition'))

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        try {
          await result.current.updateReservationStatus('res-1', 'cancelled')
        } catch (err) {
          expect(err.message).toBe('Invalid status transition')
        }
      })

      expect(result.current.error).toBe('Invalid status transition')
    })
  })

  describe('checkTableAvailability', () => {
    it('should return true when table is available', async () => {
      crmApi.checkTableAvailability.mockResolvedValue(true)

      const { result } = renderHook(() => useReservations())
      let available
      await act(async () => {
        available = await result.current.checkTableAvailability('tbl-1', '2026-07-15T20:00:00', 120)
      })

      expect(available).toBe(true)
      expect(crmApi.checkTableAvailability).toHaveBeenCalledWith({
        tableId: 'tbl-1',
        reservationDate: '2026-07-15T20:00:00',
        durationMinutes: 120,
        reservationId: null,
      })
    })

    it('should return false when table is not available', async () => {
      crmApi.checkTableAvailability.mockResolvedValue(false)

      const { result } = renderHook(() => useReservations())
      let available
      await act(async () => {
        available = await result.current.checkTableAvailability('tbl-2', '2026-07-15T21:00:00', 90)
      })

      expect(available).toBe(false)
    })

    it('should pass reservationId for exclusion check', async () => {
      crmApi.checkTableAvailability.mockResolvedValue(true)

      const { result } = renderHook(() => useReservations())
      await act(async () => {
        await result.current.checkTableAvailability('tbl-1', '2026-07-15T20:00:00', 120, 'res-existing')
      })

      expect(crmApi.checkTableAvailability).toHaveBeenCalledWith({
        tableId: 'tbl-1',
        reservationDate: '2026-07-15T20:00:00',
        durationMinutes: 120,
        reservationId: 'res-existing',
      })
    })
  })

  describe('full lifecycle', () => {
    it('should fetch → create → update status in sequence', async () => {
      const initial = [{ id: 'res-1', status: 'pending' }]
      crmApi.getReservations.mockResolvedValue(initial)

      const created = { id: 'res-2', status: 'pending', table_id: 'tbl-5' }
      crmApi.createReservation.mockResolvedValue(created)

      const confirmed = { id: 'res-2', status: 'confirmed' }
      crmApi.updateReservationStatus.mockResolvedValue(confirmed)

      const { result } = renderHook(() => useReservations())

      await act(async () => {
        await result.current.fetchReservations()
      })
      expect(result.current.reservations).toHaveLength(1)

      await act(async () => {
        await result.current.createReservation({ table_id: 'tbl-5' })
      })
      expect(result.current.reservations).toHaveLength(2)

      await act(async () => {
        await result.current.updateReservationStatus('res-2', 'confirmed')
      })
      expect(result.current.reservations.find((r) => r.id === 'res-2').status).toBe('confirmed')
    })
  })
})
