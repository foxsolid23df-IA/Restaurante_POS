import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePrinters } from '../usePrinters'
import { supabase } from '@/lib/supabase'
import { useBranchStore } from '@/store/branchStore'

// Mock branch store
vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn()
}))

describe('usePrinters', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({
      currentBranch: { id: 'branch-123' }
    })
    vi.clearAllMocks()
  })

  it('should return empty list if no branch selected', async () => {
    useBranchStore.mockReturnValue({ currentBranch: null })
    const { result } = renderHook(() => usePrinters())
    
    await act(async () => {
      const printers = await result.current.getPrinters()
      expect(printers).toEqual([])
    })
  })

  it('should fetch printers for current branch', async () => {
    const mockPrinters = [{ id: 1, name: 'Printer 1' }]
    
    // Chain mocking for: supabase.from('printers').select('*').eq(..).order(..)
    const orderMock = vi.fn().mockResolvedValue({ data: mockPrinters, error: null })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ select: selectMock })
    
    supabase.from = fromMock

    const { result } = renderHook(() => usePrinters())

    await act(async () => {
      const printers = await result.current.getPrinters()
      expect(printers).toEqual(mockPrinters)
    })

    expect(fromMock).toHaveBeenCalledWith('printers')
    expect(eqMock).toHaveBeenCalledWith('branch_id', 'branch-123')
  })
})
