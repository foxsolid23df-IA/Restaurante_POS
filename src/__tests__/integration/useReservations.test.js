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
    checkTableAvailability: vi.fn(),
  },
}))

describe('useReservations - Integration', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({ currentBranch: { id: 'br-1' } })
    vi.clearAllMocks()
  })

  it('should return empty array when no branch selected', async () => {
    useBranchStore.mockReturnValue({ currentBranch: null })
    const { result } = renderHook(() => useReservations())
    await act(async () => {
      const res = await result.current.fetchReservations()
      expect(res).toEqual([])
    })
  })

  it('should fetch and set reservations', async () => {
    const mockReservations = [
      { id: 'res-1', customer_name: 'Juan', date: '2026-07-01', table_id: 'tbl-1' },
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

  it('should handle errors gracefully', async () => {
    crmApi.getReservations.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useReservations())
    await act(async () => {
      const res = await result.current.fetchReservations()
      expect(res).toEqual([])
    })

    expect(result.current.error).toBe('API Error')
  })

  it('should check table availability', async () => {
    crmApi.checkTableAvailability.mockResolvedValue({ available: true })
    const { result } = renderHook(() => useReservations())

    let availability
    await act(async () => {
      availability = await result.current.checkTableAvailability('tbl-1', '2026-07-01', 90)
    })

    expect(availability).toEqual({ available: true })
    expect(crmApi.checkTableAvailability).toHaveBeenCalledWith({
      tableId: 'tbl-1',
      reservationDate: '2026-07-01',
      durationMinutes: 90,
      reservationId: null,
    })
  })
})
