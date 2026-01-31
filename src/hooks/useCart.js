import { useState, useCallback, useMemo } from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useBusinessStore } from './useBusinessSettings'

// Store
export const useCartStore = create(
  subscribeWithSelector((set, get) => ({
    carts: {},
    activeCartId: null,
    isCreatingCart: false,

    createCart: (tableId) => {
      const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newCart = {
        id: cartId,
        items: [],
        table_id: tableId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      set((state) => ({
        carts: { ...state.carts, [cartId]: newCart },
        activeCartId: cartId
      }))

      return cartId
    },

    setActiveCart: (cartId) => {
      set({ activeCartId: cartId })
    },

    addItem: (cartId, item) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart) return

      const existingItemIndex = cart.items.findIndex(
        (i) => i.name === item.name && 
              JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers) &&
              i.notes === item.notes
      )

      let updatedItems
      if (existingItemIndex >= 0) {
        updatedItems = cart.items.map((it, index) => {
          if (index === existingItemIndex) {
            return { ...it, quantity: it.quantity + item.quantity }
          }
          return it
        })
      } else {
        const newItem = {
          ...item,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        updatedItems = [...cart.items, newItem]
      }

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            items: updatedItems,
            updated_at: new Date().toISOString()
          }
        }
      }))
    },

    removeItem: (cartId, itemId) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart) return

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            items: cart.items.filter((item) => item.id !== itemId),
            updated_at: new Date().toISOString()
          }
        }
      }))
    },

    updateItemQuantity: (cartId, itemId, quantity) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart || quantity <= 0) return

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            items: cart.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
            updated_at: new Date().toISOString()
          }
        }
      }))
    },

    updateItemNotes: (cartId, itemId, notes) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart) return

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            items: cart.items.map((item) =>
              item.id === itemId ? { ...item, notes } : item
            ),
            updated_at: new Date().toISOString()
          }
        }
      }))
    },

    clearCart: (cartId) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart) return

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            items: [],
            updated_at: new Date().toISOString()
          }
        }
      }))
    },

    deleteCart: (cartId) => {
      const { carts, activeCartId } = get()
      const newCarts = { ...carts }
      delete newCarts[cartId]

      set((state) => ({
        carts: newCarts,
        activeCartId: activeCartId === cartId ? null : state.activeCartId
      }))
    },

    setTable: (cartId, tableId) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart) return

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            table_id: tableId,
            updated_at: new Date().toISOString()
          }
        }
      }))
    },

    setCustomerInfo: (cartId, customerInfo) => {
      const { carts } = get()
      const cart = carts[cartId]
      if (!cart) return

      set((state) => ({
        carts: {
          ...state.carts,
          [cartId]: {
            ...cart,
            customer_info,
            updated_at: new Date().toISOString()
          }
        }
      }))
    }
  }))
)

// Hook principal
export const useCart = (cartId) => {
  const {
    carts,
    activeCartId,
    isCreatingCart,
    createCart,
    setActiveCart,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemNotes,
    clearCart,
    deleteCart,
    setTable,
    setCustomerInfo
  } = useCartStore()

  const currentCartId = cartId || activeCartId
  const currentCart = currentCartId ? carts[currentCartId] : null

  const settings = useBusinessStore(state => state.settings)
  
  // Calcular totales y métricas
  const cartTotals = useMemo(() => {
    if (!currentCart) {
      return {
        subtotal: 0,
        tax: 0,
        total: 0,
        itemsCount: 0,
        uniqueItems: 0
      }
    }

    const taxRate = settings ? parseFloat(settings.tax_rate) : 0.16
    
    const subtotal = currentCart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    )
    
    const tax = subtotal * taxRate
    const total = subtotal + tax
    const itemsCount = currentCart.items.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueItems = currentCart.items.length

    return {
      subtotal,
      tax,
      total,
      taxRate,
      itemsCount,
      uniqueItems
    }
  }, [currentCart, settings])

  // Funciones helper
  const addToCart = useCallback((
    item,
    targetCartId
  ) => {
    const cart = targetCartId || currentCartId
    if (!cart) {
      const newCartId = createCart()
      addItem(newCartId, item)
      setActiveCart(newCartId)
    } else {
      addItem(cart, item)
    }
  }, [currentCartId, createCart, addItem, setActiveCart])

  const removeFromCart = useCallback((itemId, targetCartId) => {
    const cart = targetCartId || currentCartId
    if (cart) {
      removeItem(cart, itemId)
    }
  }, [currentCartId, removeItem])

  const updateQuantity = useCallback((
    itemId, 
    quantity, 
    targetCartId
  ) => {
    const cart = targetCartId || currentCartId
    if (cart && quantity > 0) {
      updateItemQuantity(cart, itemId, quantity)
    }
  }, [currentCartId, updateItemQuantity])

  const updateNotes = useCallback((
    itemId, 
    notes, 
    targetCartId
  ) => {
    const cart = targetCartId || currentCartId
    if (cart) {
      updateItemNotes(cart, itemId, notes)
    }
  }, [currentCartId, updateItemNotes])

  const clearCurrentCart = useCallback((targetCartId) => {
    const cart = targetCartId || currentCartId
    if (cart) {
      clearCart(cart)
    }
  }, [currentCartId, clearCart])

  return {
    cart: currentCart,
    carts,
    activeCartId,
    isCreatingCart,
    totals: cartTotals,
    isEmpty: !currentCart || currentCart.items.length === 0,
    itemCount: currentCart?.items.length || 0,
    createCart,
    setActiveCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNotes,
    clearCurrentCart,
    deleteCart,
    setTable,
    setCustomerInfo,
    addItem: (item) => {
      if (currentCartId) addItem(currentCartId, item)
    },
    removeItem: (itemId) => {
      if (currentCartId) removeItem(currentCartId, itemId)
    },
    updateItemQuantity,
    updateItemNotes,
    clearCart: () => {
      if (currentCartId) clearCart(currentCartId)
    }
  }
}

// Selectores para optimizar renderizado
export const useCartItems = (cartId) => {
  const currentCartId = cartId || useCartStore(state => state.activeCartId)
  return useCartStore(state => 
    currentCartId && state.carts[currentCartId] 
      ? state.carts[currentCartId].items 
      : []
  )
}

export const useCartTotals = (cartId) => {
  return useCart(cartId).totals
}

export const useActiveCart = () => {
  const activeCartId = useCartStore(state => state.activeCartId)
  const carts = useCartStore(state => state.carts)
  return activeCartId && carts[activeCartId] ? carts[activeCartId] : null
}

export default useCart