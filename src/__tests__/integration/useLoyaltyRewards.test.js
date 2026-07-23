import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLoyaltyRewards } from '@/hooks/useLoyaltyRewards'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn(),
}))

vi.mock('@/features/crm/api/crmApi', () => ({
  crmApi: {
    getRewards: vi.fn(),
    saveReward: vi.fn(),
    deleteReward: vi.fn(),
  },
}))

describe('useLoyaltyRewards - Integration', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({ currentBranch: { id: 'br-1' } })
    vi.clearAllMocks()
  })

  it('should fetch rewards on mount', async () => {
    const mockRewards = [
      { id: 'rwd-1', title: 'Free Drink', points_cost: 100 },
      { id: 'rwd-2', title: 'Discount', points_cost: 250 },
    ]
    crmApi.getRewards.mockResolvedValue(mockRewards)

    const { result } = renderHook(() => useLoyaltyRewards())
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    expect(result.current.rewards).toEqual(mockRewards)
  })

  it('should save a new reward', async () => {
    const newReward = { title: 'New Reward', points_cost: 150 }
    const createdReward = { id: 'rwd-3', ...newReward }
    crmApi.saveReward.mockResolvedValue(createdReward)

    const { result } = renderHook(() => useLoyaltyRewards())
    await act(async () => {
      await result.current.saveReward(newReward)
    })

    expect(crmApi.saveReward).toHaveBeenCalledWith(newReward, 'br-1')
    expect(result.current.rewards).toContainEqual(createdReward)
  })

  it('should delete a reward', async () => {
    crmApi.deleteReward.mockResolvedValue()

    const { result } = renderHook(() => useLoyaltyRewards())
    await act(async () => {
      await result.current.deleteReward('rwd-1')
    })

    expect(crmApi.deleteReward).toHaveBeenCalledWith('rwd-1')
  })

  it('should handle fetch errors', async () => {
    crmApi.getRewards.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLoyaltyRewards())
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    expect(result.current.error).toBe('Network error')
  })
})
