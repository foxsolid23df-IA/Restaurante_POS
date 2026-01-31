import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from './useCart'
import { useInventoryIntegration } from './useInventoryIntegration'
import { useBusinessStore } from './useBusinessSettings'
import { useBranchStore } from '@/store/branchStore'
import { useAuthStore } from '@/store/authStore'

// Hook principal
export function useOrders() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [orders, setOrders] = useState([])
  const [realtimeOrders, setRealtimeOrders] = useState([])
  const { checkInventoryAvailability, processOrderInventoryDeduction } = useInventoryIntegration()
  const { currentBranch } = useBranchStore()

  // Obtener órdenes con filtros
  const fetchOrders = useCallback(async (filters = {}) => {
    if (!currentBranch?.id) return
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables(id, name, areas(name)),
          user:profiles(id, full_name, role),
          order_items(
            *,
            products(id, name, price, image_url)
          )
        `)
        .eq('branch_id', currentBranch.id)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.table_id) {
        query = query.eq('table_id', filters.table_id)
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from + 'T00:00:00.000Z')
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59.999Z')
      }

      const { data, error } = await query

      if (error) throw error

      setOrders(data || [])
      return { data: data || [], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar órdenes'
      setError(errorMessage)
      return { data: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear orden desde un carrito
  const createOrderFromCart = useCallback(async (
    cartData,
    userId
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const activeCartId = useCartStore.getState().activeCartId
      const carts = useCartStore.getState().carts
      
      if (!activeCartId || !carts[activeCartId] || carts[activeCartId].items.length === 0) {
        throw new Error('No hay productos en el carrito para crear la orden')
      }

      const cart = carts[activeCartId]
      
      // Calcular totales
      const settings = useBusinessStore.getState().settings
      const taxRate = settings ? parseFloat(settings.tax_rate) : 0.16
      
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const tax = subtotal * taxRate
      const totalAmount = subtotal + tax

      // Crear la orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: cartData.table_id || cart.table_id,
          user_id: userId,
          branch_id: currentBranch.id,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
          customer_info: cartData.customer_info || cart.customer_info,
          notes: cartData.notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Crear los items de la orden
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_order: item.price,
        notes: item.notes,
        created_at: new Date().toISOString()
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Verificar disponibilidad de inventario antes de procesar
      const availabilityCheck = await checkInventoryAvailability(orderItems)
      
      if (!availabilityCheck.available) {
        const issuesText = availabilityCheck.issues.map(issue => 
          `${issue.item_name}: necesita ${issue.needed}, disponible ${issue.available}`
        ).join(', ')
        
        throw new Error(`Inventario insuficiente: ${issuesText}`)
      }

      // Actualizar inventario con los items de la orden
      await processOrderInventoryDeduction(orderItems)

      // Limpiar el carrito
      useCartStore.getState().clearCart(activeCartId)

      // --- LOGICA DE LEALTAD ---
      if (cartData.customer_id) {
        try {
          const pointsEarned = Math.floor(totalAmount / 10) // 1 punto por cada $10
          if (pointsEarned > 0) {
            await supabase.from('loyalty_transactions').insert([{
              customer_id: cartData.customer_id,
              points: pointsEarned,
              transaction_type: 'earn',
              description: `Compra en Orden #${order.id.slice(0, 8)}`,
              order_id: order.id
            }])

            const { data: customer } = await supabase
              .from('customers')
              .select('loyalty_points')
              .eq('id', cartData.customer_id)
              .single()

            if (customer) {
              await supabase
                .from('customers')
                .update({ loyalty_points: (customer.loyalty_points || 0) + pointsEarned })
                .eq('id', cartData.customer_id)
            }
          }
        } catch (loyaltyErr) {
          console.error('Error al procesar puntos de lealtad:', loyaltyErr)
        }
      }

      // Refrescar órdenes
      await fetchOrders()

      return { order, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear orden'
      setError(errorMessage)
      return { order: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [fetchOrders, checkInventoryAvailability, processOrderInventoryDeduction])

  // Actualizar estado de orden
  const updateOrderStatus = useCallback(async (
    orderId,
    updates
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          ...(updates.status === 'completed' && { closed_at: new Date().toISOString() })
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, ...data } : order
        )
      )

      return { order: data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar orden'
      setError(errorMessage)
      return { order: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Cancelar orden
  const cancelOrder = useCallback(async (
    orderId,
    reason
  ) => {
    return updateOrderStatus(orderId, {
      status: 'cancelled',
      notes: reason
    })
  }, [updateOrderStatus])

  // Marcar orden como pagada
  const markOrderAsPaid = useCallback(async (
    orderId,
    paymentMethod
  ) => {
    return updateOrderStatus(orderId, {
      payment_status: 'paid',
      payment_method: paymentMethod
    })
  }, [updateOrderStatus])

  // Obtener orden por ID
  const getOrderById = useCallback(async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables(id, name, areas(name)),
          user:profiles(id, full_name, role),
          order_items(
            *,
            products(id, name, price, image_url)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error

      return { order: data, error: null }
    } catch (err) {
      return { order: null, error: err.message }
    }
  }, [])

  // Setup de suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (payload.new?.id) {
            const { order } = await getOrderById(payload.new.id)
            if (order) {
              setRealtimeOrders(prev => {
                const existingIndex = prev.findIndex(o => o.id === order.id)
                if (existingIndex >= 0) {
                  const updated = [...prev]
                  updated[existingIndex] = order
                  return updated
                }
                return [...prev, order]
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [getOrderById])

  // Obtener órdenes con datos de tiempo real combinados
  const allOrders = useMemo(() => {
    const combined = [...orders]
    realtimeOrders.forEach(rtOrder => {
      const existingIndex = combined.findIndex(o => o.id === rtOrder.id)
      if (existingIndex >= 0) {
        combined[existingIndex] = rtOrder
      } else {
        combined.push(rtOrder)
      }
    })
    return combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [orders, realtimeOrders])

  // Calcular métricas de órdenes
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const userRole = useAuthStore.getState().profile?.role
    const userId = useAuthStore.getState().profile?.id

    // Si es mesero, solo ver sus propias métricas del día
    const filteredForMetrics = userRole === 'waiter' 
      ? allOrders.filter(o => o.user_id === userId)
      : allOrders

    const ordersToday = filteredForMetrics.filter(o => o.created_at.startsWith(today))
    
    return {
      totalToday: ordersToday.length,
      revenueToday: ordersToday.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
    }
  }, [allOrders])

  return {
    loading,
    error,
    orders: allOrders,
    metrics,
    fetchOrders,
    createOrderFromCart,
    updateOrderStatus,
    cancelOrder,
    markOrderAsPaid,
    getOrderById
  }
}

export default useOrders