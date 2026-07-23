import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLoyalty } from '@/hooks/useLoyalty'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn(),
}))

vi.mock('@/features/crm/api/crmApi', () => ({
  crmApi: {
    getLoyaltyTransactions: vi.fn(),
    adjustLoyaltyPoints: vi.fn(),
    getAllLoyaltyTransactions: vi.fn(),
  },
}))

describe('useLoyalty - Integration', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({ currentBranch: { id: 'br-1' } })
    vi.clearAllMocks()
  })

  it('should get points history for a customer', async () => {
    const mockTransactions = [
      { id: 'tx-1', points: 100, type: 'earn', description: 'Compra inicial' },
      { id: 'tx-2', points: -50, type: 'redeem', description: 'Canje de premio' },
    ]
    crmApi.getLoyaltyTransactions.mockResolvedValue(mockTransactions)

    const { result } = renderHook(() => useLoyalty())
    await act(async () => {
      const res = await result.current.getPointsHistory('cust-1')
      expect(res).toEqual(mockTransactions)
    })

    expect(crmApi.getLoyaltyTransactions).toHaveBeenCalledWith('cust-1')
  })

  it('should add points to a customer', async () => {
    const mockResult = { success: true, newBalance: 150 }
    crmApi.adjustLoyaltyPoints.mockResolvedValue(mockResult)

    const { result } = renderHook(() => useLoyalty())
    await act(async () => {
      const res = await result.current.addPoints('cust-1', 100, 'Compra累积')
      expect(res).toEqual(mockResult)
    })

    expect(crmApi.adjustLoyaltyPoints).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: 100,
      type: 'earn',
      description: 'Compra累积'
    })
  })

  it('should redeem points from a customer', async () => {
    const mockResult = { success: true, newBalance: 50 }
    crmApi.adjustLoyaltyPoints.mockResolvedValue(mockResult)

    const { result } = renderHook(() => useLoyalty())
    await act(async () => {
      const res = await result.current.redeemPoints('cust-1', 50, 'Canje de premio')
      expect(res).toEqual(mockResult)
    })

    expect(crmApi.adjustLoyaltyPoints).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: 50,
      type: 'redeem',
      description: 'Canje de premio'
    })
  })

  it('should adjust points (earn type)', async () => {
    crmApi.adjustLoyaltyPoints.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useLoyalty())
    let success
    await act(async () => {
      success = await result.current.adjustPoints('cust-1', 75, 'earn', 'Ajuste manual')
    })

    expect(success).toBe(true)
    expect(crmApi.adjustLoyaltyPoints).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: 75,
      type: 'earn',
      description: 'Ajuste manual'
    })
  })

  it('should adjust points (redeem type)', async () => {
    crmApi.adjustLoyaltyPoints.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useLoyalty())
    let success
    await act(async () => {
      success = await result.current.adjustPoints('cust-1', -30, 'redeem', 'Ajuste negativo')
    })

    expect(success).toBe(true)
    expect(crmApi.adjustLoyaltyPoints).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: -30,
      type: 'redeem',
      description: 'Ajuste negativo'
    })
  })

  it('should return false on adjustPoints error', async () => {
    crmApi.adjustLoyaltyPoints.mockRejectedValue(new Error('Permission denied'))

    const { result } = renderHook(() => useLoyalty())
    let success
    await act(async () => {
      success = await result.current.adjustPoints('cust-1', 50, 'earn', 'Test')
    })

    expect(success).toBe(false)
    expect(result.current.error).toBe('Permission denied')
  })

  it('should get all transactions for the branch', async () => {
    const mockAllTransactions = [
      { id: 'tx-1', customer_id: 'cust-1', points: 100 },
      { id: 'tx-2', customer_id: 'cust-2', points: -50 },
    ]
    crmApi.getAllLoyaltyTransactions.mockResolvedValue(mockAllTransactions)

    const { result } = renderHook(() => useLoyalty())
    await act(async () => {
      const res = await result.current.getAllTransactions()
      expect(res).toEqual(mockAllTransactions)
    })

    expect(crmApi.getAllLoyaltyTransactions).toHaveBeenCalledWith('br-1')
  })

  it('should handle errors gracefully', async () => {
    crmApi.getLoyaltyTransactions.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLoyalty())
    await act(async () => {
      try {
        await result.current.getPointsHistory('cust-1')
      } catch (e) {
        expect(e.message).toBe('Network error')
      }
    })

    expect(result.current.error).toBe('Network error')
  })
})
