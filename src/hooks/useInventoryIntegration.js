import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useBranchStore } from '@/store/branchStore'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'

export function useInventoryIntegration() {
  const { currentBranch } = useBranchStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inventoryUpdates, setInventoryUpdates] = useState([])
  const [alerts, setAlerts] = useState([])
  const [items, setItems] = useState([])

  const getProductRecipe = useCallback(async (productId) => {
    if (!currentBranch?.id) return []
    const { data, error } = await supabase
      .from('product_recipes')
      .select(`
        *,
        inventory_items!inner(
          id,
          name,
          current_stock,
          min_stock,
          unit,
          branch_id
        )
      `)
      .eq('product_id', productId)
      .eq('inventory_items.branch_id', currentBranch.id)

    if (error) throw error
    return data || []
  }, [currentBranch?.id])

  const getInventoryStock = useCallback(async (inventoryItemId) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', inventoryItemId)
      .single()

    if (error) throw error
    return Number.parseFloat(data?.current_stock || 0) || 0
  }, [])

  const getInventoryItems = useCallback(async (filters = {}) => {
    if (!currentBranch?.id) return []
    const results = await inventoryApi.getInventoryItems(currentBranch.id, filters)
    setItems(results)
    return results
  }, [currentBranch?.id])

  const updateInventoryStock = useCallback(async (inventoryItemId, newStock, reason) => {
    const oldStock = await getInventoryStock(inventoryItemId)
    const quantityDelta = (Number.parseFloat(newStock) || 0) - oldStock
    return inventoryApi.adjustStock({
      itemId: inventoryItemId,
      quantityDelta,
      reason: reason || 'Ajuste de inventario',
      movementType: quantityDelta >= 0 ? 'entry' : 'exit'
    })
  }, [getInventoryStock])

  const createInventoryAlert = useCallback(async () => {
    if (!currentBranch?.id) return null
    const nextAlerts = await inventoryApi.getActiveAlerts(currentBranch.id)
    setAlerts(nextAlerts)
    return nextAlerts
  }, [currentBranch?.id])

  const processOrderInventoryDeduction = useCallback(async (orderOrItems) => {
    setLoading(true)
    setError(null)
    setInventoryUpdates([])

    try {
      const orderId = typeof orderOrItems === 'string' ? orderOrItems : orderOrItems?.id
      if (!orderId) return []

      const result = await inventoryApi.processOrderInventoryDeduction(orderId)
      const updates = [{
        item_name: 'Inventario por receta',
        quantity_used: result?.itemsUpdated || 0,
        old_stock: 0,
        new_stock: 0,
        quantity_delta: 0
      }]
      setInventoryUpdates(updates)
      if (currentBranch?.id) setAlerts(await inventoryApi.getActiveAlerts(currentBranch.id))
      return updates
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en descuento de inventario'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const checkInventoryAvailability = useCallback(async (orderItems) => {
    const issues = []

    try {
      for (const orderItem of orderItems || []) {
        const recipe = await getProductRecipe(orderItem.product_id)

        for (const ingredient of recipe) {
          const inventoryItem = ingredient.inventory_items
          if (!inventoryItem) continue

          const wastage = Number.parseFloat(ingredient.wastage_percentage || 0) || 0
          const quantityNeeded = (Number.parseFloat(ingredient.quantity_required || 0) || 0)
            * (1 + (wastage / 100))
            * (Number.parseFloat(orderItem.quantity || 1) || 1)
          const currentStock = Number.parseFloat(inventoryItem.current_stock || 0) || 0

          if (currentStock < quantityNeeded) {
            issues.push({
              item_name: inventoryItem.name,
              available: currentStock,
              needed: quantityNeeded,
              unit: inventoryItem.unit
            })
          }
        }
      }
    } catch (err) {
      console.error('Error checking inventory availability:', err)
    }

    return {
      available: issues.length === 0,
      issues
    }
  }, [getProductRecipe])

  const revertInventoryChanges = useCallback(async (orderItems, reason = 'Cancelación de orden') => {
    for (const orderItem of orderItems || []) {
      const recipe = await getProductRecipe(orderItem.product_id)

      for (const ingredient of recipe) {
        const inventoryItem = ingredient.inventory_items
        if (!inventoryItem) continue

        const quantityToAdd = (Number.parseFloat(ingredient.quantity_required || 0) || 0)
          * (Number.parseFloat(orderItem.quantity || 1) || 1)

        await inventoryApi.adjustStock({
          itemId: inventoryItem.id,
          quantityDelta: quantityToAdd,
          reason: `${reason} (+${quantityToAdd} ${inventoryItem.unit})`,
          movementType: 'cancellation',
          referenceType: 'order',
          referenceId: orderItem.order_id || null
        })
      }
    }
  }, [getProductRecipe])

  const getActiveAlerts = useCallback(async () => {
    if (!currentBranch?.id) return []
    const data = await inventoryApi.getActiveAlerts(currentBranch.id)
    setAlerts(data)
    return data
  }, [currentBranch?.id])

  const resolveAlert = useCallback(async (alertId) => {
    await inventoryApi.resolveAlert(alertId)
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  useEffect(() => {
    getActiveAlerts()

    const channel = supabase
      .channel('inventory_alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [payload.new, ...prev.filter(a => a.id !== payload.new.id)])
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.resolved) setAlerts(prev => prev.filter(a => a.id !== payload.new.id))
            else setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [getActiveAlerts])

  return {
    loading,
    error,
    inventoryUpdates,
    alerts,
    items,
    processOrderInventoryDeduction,
    checkInventoryAvailability,
    revertInventoryChanges,
    getProductRecipe,
    getInventoryStock,
    getInventoryItems,
    updateInventoryStock,
    getActiveAlerts,
    createInventoryAlert,
    resolveAlert
  }
}

export const useCriticalAlerts = () => {
  const { alerts } = useInventoryIntegration()
  return alerts.filter(alert => alert.severity === 'critical')
}

export const formatInventoryUpdate = (update) => {
  const action = update.new_stock < update.old_stock ? 'deducido' : 'agregado'
  return `${update.item_name}: ${action} ${Math.abs(update.quantity_used || update.quantity_delta || 0)} ${update.unit || ''}`
}

export const getAlertColor = (severity) => {
  return severity === 'critical'
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default useInventoryIntegration
