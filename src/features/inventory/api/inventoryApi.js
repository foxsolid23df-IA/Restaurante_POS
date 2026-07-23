import { supabase } from '@/lib/supabase'

const numberValue = (value) => Number.parseFloat(value || 0) || 0

const isMissingRpc = (error) => (
  error?.code === 'PGRST202'
  || /function .* does not exist/i.test(error?.message || '')
  || /Could not find the function/i.test(error?.message || '')
)

const isMissingSchema = (error) => (
  error?.code === '42P01'
  || error?.code === '42703'
  || /does not exist/i.test(error?.message || '')
  || /Could not find/i.test(error?.message || '')
)

const rpcOrMigrationError = async (name, params) => {
  const { data, error } = await supabase.rpc(name, params)
  if (!error) return data
  if (isMissingRpc(error)) throw new Error(`Falta aplicar la migracion de compras/almacen: RPC ${name}`)
  throw error
}

const assertSchemaReady = (error, context = 'compras/almacen') => {
  if (!error) return
  if (isMissingSchema(error)) throw new Error(`Falta aplicar la migracion de ${context}`)
  throw error
}

const normalizeItem = (item = {}) => {
  const currentStock = numberValue(item.current_stock)
  const minStock = numberValue(item.min_stock)
  const cost = numberValue(item.cost_per_unit)

  return {
    ...item,
    current_stock: currentStock,
    min_stock: minStock,
    cost_per_unit: cost,
    stockStatus: currentStock <= minStock ? 'critical' : currentStock <= minStock * 1.5 ? 'warning' : 'healthy',
    totalValue: currentStock * cost,
    missingCost: cost <= 0,
    is_active: item.is_active !== false
  }
}

const applyInventoryFilters = (items, filters = {}) => {
  const search = (filters.search || '').trim().toLowerCase()

  return items.filter((item) => {
    if (search && !item.name?.toLowerCase().includes(search)) return false
    if (filters.status && filters.status !== 'all' && item.stockStatus !== filters.status) return false
    if (filters.unit && filters.unit !== 'all' && item.unit !== filters.unit) return false
    if (filters.missingCost && !item.missingCost) return false
    if (filters.active === 'inactive' && item.is_active !== false) return false
    if (filters.active !== 'inactive' && item.is_active === false) return false
    return true
  })
}

const fallbackDashboard = (items = [], alerts = []) => ({
  totalItems: items.length,
  criticalCount: items.filter((item) => item.stockStatus === 'critical').length,
  missingCostCount: items.filter((item) => item.missingCost).length,
  inventoryValue: items.reduce((sum, item) => sum + item.totalValue, 0),
  entriesToday: 0,
  exitsToday: 0,
  openAlerts: alerts.filter((alert) => !alert.resolved).length
})

export const inventoryApi = {
  async getInventoryItems(branchId, filters = {}) {
    if (!branchId) return []

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('branch_id', branchId)
      .order('name')

    if (filters.active === 'inactive') query = query.eq('is_active', false)
    else query = query.neq('is_active', false)

    let { data, error } = await query

    if (error && /is_active/i.test(error.message || '')) {
      const retry = await supabase
        .from('inventory_items')
        .select('*')
        .eq('branch_id', branchId)
        .order('name')
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    return applyInventoryFilters((data || []).map(normalizeItem), filters)
  },

  async getDashboard(branchId) {
    if (!branchId) return fallbackDashboard()

    const { data, error } = await supabase.rpc('get_inventory_dashboard', { p_branch_id: branchId })
    if (!error) return data || fallbackDashboard()
    if (!isMissingRpc(error)) throw error

    const [items, alerts] = await Promise.all([
      this.getInventoryItems(branchId, { active: 'active' }),
      this.getActiveAlerts(branchId)
    ])
    return fallbackDashboard(items, alerts)
  },

  async getActiveAlerts(branchId) {
    if (!branchId) return []
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select('*')
      .eq('branch_id', branchId)
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (error) {
      if (/inventory_alerts/i.test(error.message || '')) return []
      throw error
    }
    return data || []
  },

  async saveItem(item, branchId) {
    if (!branchId) throw new Error('Selecciona una sucursal antes de guardar inventario')

    const payload = {
      name: item.name?.trim(),
      unit: item.unit,
      branch_id: branchId,
      current_stock: numberValue(item.current_stock),
      min_stock: numberValue(item.min_stock),
      cost_per_unit: numberValue(item.cost_per_unit),
      is_active: item.is_active !== false,
      updated_at: new Date().toISOString()
    }

    if (!payload.name) throw new Error('El nombre del insumo es obligatorio')
    if (!payload.unit) throw new Error('La unidad operativa es obligatoria')
    if (payload.current_stock < 0 || payload.min_stock < 0 || payload.cost_per_unit < 0) {
      throw new Error('Stock, minimo y costo no pueden ser negativos')
    }

    if (item.id) {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(payload)
        .eq('id', item.id)
        .select()
        .single()
      if (error) throw error
      return normalizeItem(data)
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return normalizeItem(data)
  },

  async deleteOrDeactivateItem(itemId) {
    const checks = await Promise.all([
      supabase.from('product_recipes').select('id', { count: 'exact', head: true }).eq('inventory_item_id', itemId),
      supabase.from('purchase_items').select('id', { count: 'exact', head: true }).eq('inventory_item_id', itemId),
      supabase.from('inventory_log').select('id', { count: 'exact', head: true }).eq('inventory_item_id', itemId)
    ])

    const hasHistory = checks.some(({ count }) => Number(count || 0) > 0)
    if (hasHistory) {
      const { error } = await supabase
        .from('inventory_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
      return { action: 'deactivated' }
    }

    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId)
    if (error) throw error
    return { action: 'deleted' }
  },

  async reactivateItem(itemId) {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', itemId)
    if (error) throw error
  },

  async adjustStock({ itemId, quantityDelta, reason, movementType = 'adjustment', referenceType = null, referenceId = null }) {
    if (!itemId) throw new Error('Insumo no valido')
    if (!Number.isFinite(Number(quantityDelta)) || Number(quantityDelta) === 0) throw new Error('El ajuste debe ser diferente de cero')
    if (!reason?.trim()) throw new Error('El motivo del ajuste es obligatorio')

    return rpcOrMigrationError('adjust_inventory_stock', {
      p_inventory_item_id: itemId,
      p_quantity_delta: Number(quantityDelta),
      p_reason: reason.trim(),
      p_movement_type: movementType,
      p_reference_type: referenceType,
      p_reference_id: referenceId
    })
  },

  async getMovements({ itemId = null, branchId = null, limit = 50 } = {}) {
    const { data, error } = await supabase.rpc('get_inventory_movements', {
      p_inventory_item_id: itemId,
      p_branch_id: branchId,
      p_limit: limit
    })

    if (!error) return Array.isArray(data) ? data : []
    if (!isMissingRpc(error)) throw error

    let query = supabase
      .from('inventory_log')
      .select('*, inventory_items(name, unit), profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemId) query = query.eq('inventory_item_id', itemId)
    if (branchId) query = query.eq('branch_id', branchId)

    const fallback = await query
    if (fallback.error) throw fallback.error

    return (fallback.data || []).map((log) => ({
      id: log.id,
      inventoryItemId: log.inventory_item_id,
      itemName: log.inventory_items?.name,
      unit: log.inventory_items?.unit,
      oldStock: log.old_stock,
      newStock: log.new_stock,
      quantityDelta: log.quantity_delta ?? (numberValue(log.new_stock) - numberValue(log.old_stock)),
      movementType: log.movement_type || (numberValue(log.new_stock) >= numberValue(log.old_stock) ? 'entry' : 'exit'),
      referenceType: log.reference_type,
      referenceId: log.reference_id,
      reason: log.reason,
      createdAt: log.created_at,
      userName: log.profiles?.full_name
    }))
  },

  async resolveAlert(alertId) {
    return rpcOrMigrationError('resolve_inventory_alert', { p_alert_id: alertId })
  },

  async getSuppliers(branchId) {
    if (!branchId) return []
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('branch_id', branchId)
      .neq('is_active', false)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async saveSupplier(supplier, branchId) {
    if (!branchId) throw new Error('Selecciona una sucursal')
    const payload = {
      ...supplier,
      name: supplier.name?.trim(),
      branch_id: supplier.branch_id || branchId,
      updated_at: new Date().toISOString()
    }
    if (!payload.name) throw new Error('El nombre del proveedor es obligatorio')

    if (supplier.id) {
      const { data, error } = await supabase.from('suppliers').update(payload).eq('id', supplier.id).select().single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('suppliers').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async getSupplierCategories(branchId) {
    let query = supabase
      .from('supplier_categories')
      .select('*')
      .neq('is_active', false)
      .order('name')

    if (branchId) query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
    const { data, error } = await query
    if (error && isMissingSchema(error)) return []
    if (error) throw error
    return data || []
  },

  async saveSupplierCategory(name, branchId) {
    if (!name?.trim()) throw new Error('El nombre de categoria es obligatorio')
    const { data, error } = await supabase
      .from('supplier_categories')
      .insert({ name: name.trim(), branch_id: branchId || null })
      .select()
      .single()
    assertSchemaReady(error)
    return data
  },

  async deleteSupplierCategory(categoryId) {
    const { error } = await supabase
      .from('supplier_categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', categoryId)
    assertSchemaReady(error)
  },

  async getPurchases(branchId, filters = {}) {
    if (!branchId) return []
    let query = supabase
      .from('purchases')
      .select('*, suppliers(name, category), profiles!user_id(full_name)')
      .eq('branch_id', branchId)
      .order('purchase_date', { ascending: false })

    if (filters.startDate) query = query.gte('purchase_date', filters.startDate)
    if (filters.endDate) query = query.lte('purchase_date', `${filters.endDate}T23:59:59.999Z`)
    if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.statuses?.length) query = query.in('status', filters.statuses)

    const { data, error } = await query
    assertSchemaReady(error)
    return data || []
  },

  async createPurchase(purchaseData, items, branchId, status = 'draft') {
    if (!branchId) throw new Error('Selecciona una sucursal')
    if (!purchaseData.supplier_id) throw new Error('Selecciona un proveedor')
    if (!items?.length) throw new Error('Agrega al menos un insumo')
    if (items.some((item) => numberValue(item.quantity) <= 0 || numberValue(item.unit_cost) < 0)) {
      throw new Error('Cada insumo debe tener cantidad mayor a cero y costo valido')
    }

    const normalizedItems = items.map((item) => ({
      inventory_item_id: item.inventory_item_id,
      quantity: numberValue(item.quantity),
      unit_cost: numberValue(item.unit_cost),
      total_cost: numberValue(item.quantity) * numberValue(item.unit_cost),
      notes: item.notes || null
    }))

    return rpcOrMigrationError('create_purchase_with_items', {
      p_purchase: {
        ...purchaseData,
        branch_id: branchId,
        status,
        received_at: null
      },
      p_items: normalizedItems
    })
  },

  async receivePurchase(purchaseId, items = null) {
    return rpcOrMigrationError('receive_purchase_inventory', {
      p_purchase_id: purchaseId,
      p_items: items
    })
  },

  async cancelPurchase(purchaseId, reason) {
    if (!reason?.trim()) throw new Error('El motivo de cancelacion es obligatorio')
    return rpcOrMigrationError('cancel_purchase', {
      p_purchase_id: purchaseId,
      p_reason: reason.trim()
    })
  },

  async getPurchaseDetails(purchaseId) {
    const { data, error } = await supabase
      .from('purchase_items')
      .select('*, inventory_items(name, unit)')
      .eq('purchase_id', purchaseId)
    assertSchemaReady(error)
    return data || []
  },

  async getWarehouseDashboard(branchId) {
    if (!branchId) return {}
    return rpcOrMigrationError('get_warehouse_dashboard', { p_branch_id: branchId })
  },

  async getPurchaseSuggestions(branchId) {
    if (!branchId) return []
    const data = await rpcOrMigrationError('get_purchase_suggestions', { p_branch_id: branchId })
    return Array.isArray(data) ? data : []
  },

  async getTransfers(branchId) {
    if (!branchId) return []
    const { data, error } = await supabase
      .from('inventory_transfers')
      .select('*, from_branch:branches!inventory_transfers_from_branch_id_fkey(name), to_branch:branches!inventory_transfers_to_branch_id_fkey(name), profiles:profiles!inventory_transfers_requested_by_fkey(full_name), inventory_transfer_items(*, inventory_items(name, unit, current_stock))')
      .or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`)
      .order('created_at', { ascending: false })
    assertSchemaReady(error)
    return data || []
  },

  async createTransfer({ fromBranchId, toBranchId, items, notes }) {
    if (!fromBranchId || !toBranchId || fromBranchId === toBranchId) throw new Error('Selecciona sucursales validas')
    if (!items?.length) throw new Error('Agrega al menos un insumo')
    if (items.some((item) => !item.inventory_item_id || numberValue(item.quantity) <= 0)) {
      throw new Error('Cada insumo debe tener cantidad mayor a cero')
    }

    return rpcOrMigrationError('create_inventory_transfer', {
      p_from_branch_id: fromBranchId,
      p_to_branch_id: toBranchId,
      p_items: items.map((item) => ({
        inventory_item_id: item.inventory_item_id,
        quantity: numberValue(item.quantity)
      })),
      p_notes: notes || null
    })
  },

  async completeTransfer(transferId) {
    return rpcOrMigrationError('complete_inventory_transfer', { p_transfer_id: transferId })
  },

  async processOrderInventoryDeduction(orderId) {
    return rpcOrMigrationError('process_order_inventory_deduction', { p_order_id: orderId })
  }
}

export { numberValue, normalizeItem }
