import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePrinters } from '../usePrinters'
import { useBranchStore } from '@/store/branchStore'

vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn()
}))

vi.mock('@/features/settings/api/settingsApi', () => ({
  settingsApi: {
    getPrinters: vi.fn(),
    savePrinter: vi.fn(),
    deactivatePrinter: vi.fn(),
  }
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
    const { settingsApi } = await import('@/features/settings/api/settingsApi')
    settingsApi.getPrinters.mockResolvedValue(mockPrinters)

    const { result } = renderHook(() => usePrinters())

    await act(async () => {
      const printers = await result.current.getPrinters()
      expect(printers).toEqual(mockPrinters)
    })

    expect(settingsApi.getPrinters).toHaveBeenCalledWith('branch-123')
  })
})
