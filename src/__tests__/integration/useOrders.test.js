import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOrders } from '@/hooks/useOrders'
import { useBranchStore } from '@/store/branchStore'
import { useCartStore } from '@/hooks/useCart'
import { supabase } from '@/lib/supabase'

vi.mock('@/store/branchStore', () => ({
  useBranchStore: vi.fn(),
}))

vi.mock('@/hooks/useInventoryIntegration', () => ({
  useInventoryIntegration: () => ({
    checkInventoryAvailability: vi.fn().mockResolvedValue({ available: true, issues: [] }),
    processOrderInventoryDeduction: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/hooks/useBusinessSettings', () => ({
  useBusinessStore: {
    getState: vi.fn(() => ({
      settings: { tax_rate: '0.16' },
    })),
  },
}))

vi.mock('@/features/crm/api/crmApi', () => ({
  crmApi: {
    updateClientHistory: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockOrder = {
  id: 'ord-1',
  table_id: 'tbl-1',
  user_id: 'usr-1',
  branch_id: 'br-1',
  total_amount: 116,
  status: 'pending',
  payment_status: 'pending',
  created_at: '2026-06-30T12:00:00.000Z',
  tables: { id: 'tbl-1', name: 'Mesa 1', areas: { name: 'Salón' } },
  user: { id: 'usr-1', full_name: 'Test User', role: 'staff' },
  order_items: [{ id: 'oi-1', product_id: 'prod-1', quantity: 2, price_at_order: 50, products: { id: 'prod-1', name: 'Producto 1', price: 50 } }],
}

function makeQueryChain(resolvedValue = { data: [], error: null }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    then: vi.fn((resolve) => resolve(resolvedValue)),
    catch: vi.fn(),
  }
  return chain
}

describe('useOrders - Integration', () => {
  beforeEach(() => {
    useBranchStore.mockReturnValue({ currentBranch: { id: 'br-1' } })
    vi.clearAllMocks()
  })

  describe('fetchOrders', () => {
    it('should return undefined when no branch selected', async () => {
      useBranchStore.mockReturnValue({ currentBranch: null })
      const { result } = renderHook(() => useOrders())
      await act(async () => {
        const res = await result.current.fetchOrders()
        expect(res).toBeUndefined()
      })
    })

    it('should fetch orders with default query', async () => {
      const chain = makeQueryChain({ data: [mockOrder], error: null })
      supabase.from.mockReturnValue(chain)

      const { result } = renderHook(() => useOrders())
      await act(async () => {
        const res = await result.current.fetchOrders()
        expect(res.data).toEqual([mockOrder])
      })

      expect(supabase.from).toHaveBeenCalledWith('orders')
    })

    it('should apply status filter', async () => {
      const chain = makeQueryChain({ data: [mockOrder], error: null })
      supabase.from.mockReturnValue(chain)

      const { result } = renderHook(() => useOrders())
      await act(async () => {
        await result.current.fetchOrders({ status: 'completed' })
      })

      expect(chain.eq).toHaveBeenCalledWith('status', 'completed')
    })

    it('should handle supabase error', async () => {
      const chain = makeQueryChain({ data: null, error: new Error('DB error') })
      supabase.from.mockReturnValue(chain)

      const { result } = renderHook(() => useOrders())
      await act(async () => {
        const res = await result.current.fetchOrders()
        expect(res.data).toEqual([])
        expect(res.error).toBeTruthy()
      })
    })
  })

  describe('createOrderFromCart', () => {
    it('should return error when cart is empty', async () => {
      useCartStore.getState = vi.fn(() => ({
        activeCartId: null,
        carts: {},
      }))

      const { result } = renderHook(() => useOrders())
      await act(async () => {
        const res = await result.current.createOrderFromCart({}, 'usr-1')
        expect(res.error).toBe('No hay productos en el carrito para crear la orden')
        expect(res.order).toBeNull()
      })
    })

    it('should create order and order items', async () => {
      const mockCartId = 'cart_123'
      const clearCartFn = vi.fn()
      useCartStore.getState = vi.fn(() => ({
        activeCartId: mockCartId,
        carts: {
          [mockCartId]: {
            id: mockCartId,
            table_id: 'tbl-1',
            items: [{ product_id: 'prod-1', id: 'prod-1', name: 'Producto 1', price: 50, quantity: 2, notes: '' }],
            customer_id: null,
            customer_info: null,
          },
        },
        clearCart: clearCartFn,
      }))

      const orderChain = makeQueryChain({ data: { id: 'ord-1' }, error: null })
      const itemsChain = makeQueryChain({ error: null })
      supabase.from.mockReturnValueOnce(orderChain).mockReturnValueOnce(itemsChain)

      const { result } = renderHook(() => useOrders())
      await act(async () => {
        const res = await result.current.createOrderFromCart({}, 'usr-1')
        expect(res.order).toBeDefined()
        expect(res.order.id).toBe('ord-1')
      })
    })
  })

  describe('realtime subscription', () => {
    it('should subscribe to orders channel on mount and unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useOrders())
      expect(supabase.channel).toHaveBeenCalled()
      unmount()
      expect(supabase.removeChannel).toHaveBeenCalled()
    })
  })
})
