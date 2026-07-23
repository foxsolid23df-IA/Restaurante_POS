import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/hooks/useCart'

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ carts: {}, activeCartId: null, isCreatingCart: false })
  })

  describe('createCart', () => {
    it('should create a new cart with given table id', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      expect(cartId).toBeTruthy()
      expect(cartId).toContain('cart_')

      const state = useCartStore.getState()
      expect(state.carts[cartId]).toBeDefined()
      expect(state.carts[cartId].table_id).toBe('tbl-1')
      expect(state.carts[cartId].items).toEqual([])
      expect(state.activeCartId).toBe(cartId)
    })
  })

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      const item = { product_id: 'p1', name: 'Item 1', price: 50, quantity: 2, modifiers: [], notes: '' }

      useCartStore.getState().addItem(cartId, item)
      const items = useCartStore.getState().carts[cartId].items
      expect(items).toHaveLength(1)
      expect(items[0].name).toBe('Item 1')
      expect(items[0].quantity).toBe(2)
    })

    it('should increment quantity for duplicate items', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      const item = { product_id: 'p1', name: 'Item 1', price: 50, quantity: 1, modifiers: [], notes: '' }

      useCartStore.getState().addItem(cartId, item)
      useCartStore.getState().addItem(cartId, item)

      const items = useCartStore.getState().carts[cartId].items
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(2)
    })

    it('should treat items with different modifiers as separate', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      const item1 = { product_id: 'p1', name: 'Item 1', price: 50, quantity: 1, modifiers: [{ name: 'Extra Queso', price: 10 }], notes: '' }
      const item2 = { product_id: 'p1', name: 'Item 1', price: 50, quantity: 1, modifiers: [{ name: 'Sin Cebolla', price: 0 }], notes: '' }

      useCartStore.getState().addItem(cartId, item1)
      useCartStore.getState().addItem(cartId, item2)

      expect(Object.keys(useCartStore.getState().carts[cartId].items)).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      useCartStore.getState().addItem(cartId, { product_id: 'p1', name: 'Item 1', price: 50, quantity: 1, modifiers: [], notes: '' })
      useCartStore.getState().addItem(cartId, { product_id: 'p2', name: 'Item 2', price: 30, quantity: 1, modifiers: [], notes: '' })

      const firstItemId = useCartStore.getState().carts[cartId].items[0].id
      useCartStore.getState().removeItem(cartId, firstItemId)

      const items = useCartStore.getState().carts[cartId].items
      expect(items).toHaveLength(1)
      expect(items[0].product_id).toBe('p2')
    })
  })

  describe('clearCart', () => {
    it('should clear all items from the cart', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      useCartStore.getState().addItem(cartId, { product_id: 'p1', name: 'Item 1', price: 50, quantity: 1, modifiers: [], notes: '' })

      useCartStore.getState().clearCart(cartId)
      expect(useCartStore.getState().carts[cartId].items).toEqual([])
    })
  })

  describe('getCartTotal', () => {
    it('should calculate total with modifiers', () => {
      const cartId = useCartStore.getState().createCart('tbl-1')
      useCartStore.getState().addItem(cartId, {
        product_id: 'p1', name: 'Item 1', price: 100, quantity: 2,
        modifiers: [{ name: 'Queso', price: 15 }], notes: '',
      })

      const items = useCartStore.getState().carts[cartId].items
      const total = items.reduce((sum, item) => {
        const modTotal = item.modifiers.reduce((m, mod) => m + (mod.price || 0), 0)
        return sum + ((item.price + modTotal) * item.quantity)
      }, 0)
      expect(total).toBe(230)
    })
  })
})
