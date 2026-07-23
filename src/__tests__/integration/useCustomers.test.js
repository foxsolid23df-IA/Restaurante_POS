import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCustomers } from '@/hooks/useCustomers'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn(),
}))

vi.mock('@/features/crm/api/crmApi', () => ({
  crmApi: {
    getCustomers: vi.fn(),
    saveCustomer: vi.fn(),
    deactivateOrDeleteCustomer: vi.fn(),
  },
}))

describe('useCustomers - Integration', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({ currentBranch: { id: 'br-1' } })
    vi.clearAllMocks()
  })

  it('should return empty array when no branch selected', async () => {
    useBranchStore.mockReturnValue({ currentBranch: null })
    crmApi.getCustomers.mockResolvedValue([])
    
    const { result } = renderHook(() => useCustomers())
    await act(async () => {
      await result.current.fetchCustomers()
    })
    expect(result.current.customers).toEqual([])
  })

  it('should fetch and set customers', async () => {
    const mockCustomers = [
      { id: 'cust-1', name: 'Juan Perez', phone: '5512345678', loyalty_points: 100 },
      { id: 'cust-2', name: 'Maria Lopez', phone: '5587654321', loyalty_points: 250 },
    ]
    crmApi.getCustomers.mockResolvedValue(mockCustomers)

    const { result } = renderHook(() => useCustomers())
    await act(async () => {
      const res = await result.current.fetchCustomers()
      expect(res).toEqual(mockCustomers)
    })

    expect(crmApi.getCustomers).toHaveBeenCalledWith('br-1', {})
    expect(result.current.customers).toEqual(mockCustomers)
  })

  it('should create a new customer', async () => {
    const newCustomer = { name: 'Pedro Garcia', phone: '5511112222', email: 'pedro@test.com' }
    const createdCustomer = { id: 'cust-3', ...newCustomer, loyalty_points: 0 }
    crmApi.saveCustomer.mockResolvedValue(createdCustomer)

    const { result } = renderHook(() => useCustomers())
    await act(async () => {
      const res = await result.current.createCustomer(newCustomer)
      expect(res).toEqual(createdCustomer)
    })

    expect(crmApi.saveCustomer).toHaveBeenCalledWith(newCustomer, 'br-1')
    expect(result.current.customers).toContainEqual(createdCustomer)
  })

  it('should update an existing customer', async () => {
    const existingCustomer = { id: 'cust-1', name: 'Juan Perez', phone: '5512345678' }
    const updates = { name: 'Juan Perez Garcia' }
    const updatedCustomer = { ...existingCustomer, ...updates }
    crmApi.saveCustomer.mockResolvedValue(updatedCustomer)

    const { result } = renderHook(() => useCustomers())
    await act(async () => {
      const res = await result.current.updateCustomer('cust-1', updates)
      expect(res).toEqual(updatedCustomer)
    })

    expect(crmApi.saveCustomer).toHaveBeenCalledWith({ ...updates, id: 'cust-1' }, 'br-1')
  })

  it('should delete a customer', async () => {
    crmApi.deactivateOrDeleteCustomer.mockResolvedValue({ action: 'deleted' })

    const { result } = renderHook(() => useCustomers())
    await act(async () => {
      const res = await result.current.deleteCustomer('cust-1')
      expect(res).toEqual({ action: 'deleted' })
    })

    expect(crmApi.deactivateOrDeleteCustomer).toHaveBeenCalledWith('cust-1')
  })

  it('should handle errors gracefully', async () => {
    crmApi.getCustomers.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useCustomers())
    await act(async () => {
      const res = await result.current.fetchCustomers()
      expect(res).toEqual([])
    })

    expect(result.current.error).toBe('API Error')
  })
})
