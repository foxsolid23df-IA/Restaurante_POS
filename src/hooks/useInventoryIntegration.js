import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Types
// En archivos JS no usamos interfaces de TS

import { useBranchStore } from '@/store/branchStore'

// Hook principal
export function useInventoryIntegration() {
  const { currentBranch } = useBranchStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inventoryUpdates, setInventoryUpdates] = useState([])
  const [alerts, setAlerts] = useState([])
  const [items, setItems] = useState([])

  // Obtener receta de un producto
  const getProductRecipe = useCallback(async (productId) => {
    try {
      const { data, error } = await supabase
        .from('product_recipes')
        .select(`
          *,
          inventory_items!inner(
            id,
            name,
            current_stock,
            min_stock,
            unit
          )
        `)
        .eq('product_id', productId)
        .eq('inventory_items.branch_id', currentBranch.id)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting product recipe:', err)
      throw err
    }
  }, [currentBranch])

  // Obtener stock actual de un item
  const getInventoryStock = useCallback(async (inventoryItemId) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', inventoryItemId)
        .single()

      if (error) throw error
      return data?.current_stock || 0
    } catch (err) {
      console.error('Error getting inventory stock:', err)
      throw err
    }
  }, [])

  // Actualizar stock de inventario
  const updateInventoryStock = useCallback(async (
    inventoryItemId,
    newStock,
    reason
  ) => {
    try {
      const oldStock = await getInventoryStock(inventoryItemId)
      
      const { error } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock
        })
        .eq('id', inventoryItemId)

      if (error) throw error

      // Registrar el cambio en el log
      await logInventoryChange(inventoryItemId, oldStock, newStock, reason)
      
      // Verificar si necesita alerta
      const item = await getInventoryItem(inventoryItemId)
      if (item && newStock <= item.min_stock) {
        await createInventoryAlert(item)
      }
    } catch (err) {
      console.error('Error updating inventory stock:', err)
      throw err
    }
  }, [getInventoryStock])

  // Obtener todos los items de inventario (para búsqueda)
  const getInventoryItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name')

      if (error) throw error
      const results = data || []
      setItems(results)
      return results
    } catch (err) {
      console.error('Error getting inventory items:', err)
      return []
    }
  }, [currentBranch])

  // Obtener item completo de inventario
  const getInventoryItem = useCallback(async (inventoryItemId) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', inventoryItemId)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error getting inventory item:', err)
      return null
    }
  }, [])

  // Registrar cambio en el log de inventario
  const logInventoryChange = useCallback(async (
    inventoryItemId,
    oldStock,
    newStock,
    reason
  ) => {
    try {
      await supabase
        .from('inventory_log')
        .insert({
          inventory_item_id: inventoryItemId,
          old_stock: oldStock,
          new_stock: newStock,
          quantity_used: oldStock - newStock,
          reason: reason || 'Venta de producto',
          created_at: new Date().toISOString()
        })
    } catch (err) {
      console.error('Error logging inventory change:', err)
      // No lanzar error, es un log
    }
  }, [])

  // Crear alerta de inventario
  const createInventoryAlert = useCallback(async (item) => {
    try {
      // Evitar duplicados (no crear si ya hay una alerta no resuelta para este item)
      const { data: existing } = await supabase
        .from('inventory_alerts')
        .select('id')
        .eq('inventory_item_id', item.id || item.inventory_item_id)
        .eq('resolved', false)
        .maybeSingle()

      if (existing) return

      const severity = item.current_stock <= item.min_stock * 0.5 ? 'critical' : 'low'
      
      const { data, error } = await supabase
        .from('inventory_alerts')
        .insert({
          inventory_item_id: item.id || item.inventory_item_id,
          branch_id: currentBranch.id,
          item_name: item.name,
          current_stock: item.current_stock,
          min_stock: item.min_stock,
          unit: item.unit,
          severity,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setAlerts(prev => [data, ...prev])
    } catch (err) {
      console.error('Error creating inventory alert:', err)
    }
  }, [currentBranch])

  // Procesar descuento de inventario para una orden
  const processOrderInventoryDeduction = useCallback(async (
    orderItems
  ) => {
    setLoading(true)
    setError(null)
    setInventoryUpdates([])

    try {
      const updates = []

      // Procesar cada item de la orden
      for (const orderItem of orderItems) {
        // Obtener la receta del producto
        const recipe = await getProductRecipe(orderItem.product_id)
        
        if (!recipe || recipe.length === 0) {
          // Si no tiene receta, continuar al siguiente producto
          continue
        }

        // Procesar cada ingrediente de la receta
        for (const ingredient of recipe) {
          const inventoryItem = ingredient.inventory_items
          if (!inventoryItem) continue

          const wastage = parseFloat(ingredient.wastage_percentage) || 0
          const quantityNeeded = (ingredient.quantity_required * (1 + (wastage / 100))) * orderItem.quantity
          const currentStock = inventoryItem.current_stock
          const newStock = Math.max(0, currentStock - quantityNeeded)
          const quantityUsed = currentStock - newStock

          // Verificar si hay stock suficiente
          if (currentStock < quantityNeeded) {
            const shortage = quantityNeeded - currentStock
            console.warn(`Insufficient stock for ${inventoryItem.name}. Short: ${shortage} ${inventoryItem.unit}`)
            
            // Crear alerta crítica
            await createInventoryAlert({
              ...inventoryItem,
              id: inventoryItem.id,
              current_stock: newStock,
              min_stock: inventoryItem.min_stock
            })
          }

          // Actualizar el stock
          await updateInventoryStock(
            inventoryItem.id,
            newStock,
            `Orden #${Date.now()} - ${orderItem.quantity}x Producto ${orderItem.product_id}`
          )

          // Registrar la actualización
          const update = {
            inventory_item_id: inventoryItem.id,
            old_stock: currentStock,
            new_stock: newStock,
            quantity_used: quantityUsed,
            item_name: inventoryItem.name,
            is_below_min: newStock <= inventoryItem.min_stock
          }

          updates.push(update)
        }
      }

      setInventoryUpdates(updates)
      return updates

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en descuento de inventario'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getProductRecipe, updateInventoryStock, createInventoryAlert])

  // Verificar disponibilidad de inventario antes de crear orden
  const checkInventoryAvailability = useCallback(async (
    orderItems
  ) => {
    try {
      const issues = []

      for (const orderItem of orderItems) {
        const recipe = await getProductRecipe(orderItem.product_id)
        
        if (!recipe || recipe.length === 0) {
          continue // Producto sin receta, siempre disponible
        }

        for (const ingredient of recipe) {
          const inventoryItem = ingredient.inventory_items
          if (!inventoryItem) continue

          const wastage = parseFloat(ingredient.wastage_percentage) || 0
          const quantityNeeded = (ingredient.quantity_required * (1 + (wastage / 100))) * orderItem.quantity
          const currentStock = inventoryItem.current_stock

          if (currentStock < quantityNeeded) {
            issues.push({
              item_name: inventoryItem.name,
              available: currentStock,
              needed: quantityNeeded
            })
          }
        }
      }

      return {
        available: issues.length === 0,
        issues
      }
    } catch (err) {
      console.error('Error checking inventory availability:', err)
      return { available: false, issues: [] }
    }
  }, [getProductRecipe])

  // Revertir cambios en inventario (para cancelaciones)
  const revertInventoryChanges = useCallback(async (
    orderItems
  ) => {
    try {
      for (const orderItem of orderItems) {
        const recipe = await getProductRecipe(orderItem.product_id)
        
        if (!recipe || recipe.length === 0) continue

        for (const ingredient of recipe) {
          const inventoryItem = ingredient.inventory_items
          if (!inventoryItem) continue

          const quantityToAdd = ingredient.quantity_required * orderItem.quantity
          const currentStock = await getInventoryStock(inventoryItem.id)
          const newStock = currentStock + quantityToAdd

          await updateInventoryStock(
            inventoryItem.id,
            newStock,
            `Cancelación de orden - +${quantityToAdd} ${inventoryItem.unit}`
          )
        }
      }
    } catch (err) {
      console.error('Error reverting inventory changes:', err)
      throw err
    }
  }, [getProductRecipe, getInventoryStock, updateInventoryStock])

  // Obtener alertas activas
  const getActiveAlerts = useCallback(async () => {
    if (!currentBranch?.id) return []
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('resolved', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting active alerts:', err)
      return []
    }
  }, [currentBranch])

  // Marcar alerta como resuelta
  const resolveAlert = useCallback(async (alertId) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (err) {
      console.error('Error resolving alert:', err)
      throw err
    }
  }, [])

  // Load initial alerts and setup real-time
  useEffect(() => {
    getActiveAlerts().then(setAlerts)

    const channel = supabase
      .channel('inventory_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_alerts'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [payload.new, ...prev.filter(a => a.id !== payload.new.id)])
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.resolved) {
              setAlerts(prev => prev.filter(a => a.id !== payload.new.id))
            } else {
              setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
            }
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
    // Estado
    loading,
    error,
    inventoryUpdates,
    alerts,
    items,

    // Funciones principales
    processOrderInventoryDeduction,
    checkInventoryAvailability,
    revertInventoryChanges,
    
    // Funciones auxiliares
    getProductRecipe,
    getInventoryStock,
    getInventoryItems,
    updateInventoryStock,
    
    // Gestión de alertas
    getActiveAlerts,
    createInventoryAlert,
    resolveAlert
  }
}

// Selector personalizado para alertas críticas
export const useCriticalAlerts = () => {
  const { alerts } = useInventoryIntegration()
  return alerts.filter(alert => alert.severity === 'critical')
}

// Helper functions
export const formatInventoryUpdate = (update) => {
  const action = update.new_stock < update.old_stock ? 'deducido' : 'agregado'
  return `${update.item_name}: ${action} ${Math.abs(update.quantity_used)} ${update.unit}`
}

export const getAlertColor = (severity) => {
  return severity === 'critical' 
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default useInventoryIntegration