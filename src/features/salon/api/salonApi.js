import { supabase } from '@/lib/supabase'

const migrationError = (action) => (
  new Error(`No se pudo ${action}. Aplica la migracion salon_architecture_mvp en Supabase y vuelve a intentar.`)
)

const rpcOrThrow = async (name, params, action) => {
  const { data, error } = await supabase.rpc(name, params)
  if (error) {
    if (
      error.code === '42883'
      || error.code === 'PGRST202'
      || error.code === '404'
      || /function .* does not exist/i.test(error.message || '')
      || /Could not find the function/i.test(error.message || '')
    ) {
      throw migrationError(action)
    }
    throw error
  }
  return data
}

const emptyLayout = () => ({
  areas: [],
  tables: [],
  metrics: {
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    maintenance: 0,
    totalCapacity: 0,
    occupiedCapacity: 0,
    utilizationRate: 0
  }
})

const isMissingSchema = (error) => (
  error?.code === '42P01'
  || error?.code === '42703'
  || error?.code === '404'
  || /does not exist/i.test(error?.message || '')
  || /Could not find/i.test(error?.message || '')
)

export const normalizeArea = (area = {}) => ({
  ...area,
  id: area.id,
  branch_id: area.branch_id,
  name: area.name || 'Area sin nombre',
  description: area.description || '',
  color: area.color || '#2563eb',
  sort_order: Number(area.sort_order || 0),
  is_active: area.is_active ?? area.isActive ?? true
})

export const normalizeTable = (table = {}) => ({
  ...table,
  id: table.id,
  branch_id: table.branch_id,
  area_id: table.area_id,
  name: table.name || 'Mesa',
  capacity: Number(table.capacity || 4),
  status: table.status || 'available',
  shape: table.shape || 'rounded',
  x_pos: Number(table.x_pos ?? 20),
  y_pos: Number(table.y_pos ?? 20),
  rotation: Number(table.rotation || 0),
  sort_order: Number(table.sort_order || 0),
  is_active: table.is_active ?? table.isActive ?? true,
  current_order: table.current_order || null,
  next_reservation: table.next_reservation || null,
  areas: table.areas || null
})

const areaPayload = (area = {}, branchId) => ({
  id: area.id || null,
  branch_id: area.branch_id || branchId || null,
  name: area.name?.trim(),
  description: area.description?.trim() || null,
  color: area.color || '#2563eb',
  sort_order: Number(area.sort_order || 0),
  is_active: area.is_active ?? true
})

const tablePayload = (table = {}, branchId) => ({
  id: table.id || null,
  branch_id: table.branch_id || branchId || null,
  area_id: table.area_id || null,
  name: table.name?.trim(),
  capacity: Number(table.capacity || 4),
  status: table.status || 'available',
  shape: table.shape || 'rounded',
  x_pos: Number(table.x_pos ?? 20),
  y_pos: Number(table.y_pos ?? 20),
  rotation: Number(table.rotation || 0),
  sort_order: Number(table.sort_order || 0),
  is_active: table.is_active ?? true
})

export const salonApi = {
  async getLayout(branchId) {
    if (!branchId) {
      return emptyLayout()
    }

    let data
    try {
      data = await rpcOrThrow('get_salon_layout', { p_branch_id: branchId }, 'cargar el salon')
    } catch (error) {
      if (!/salon_architecture_mvp/i.test(error.message || '') && !isMissingSchema(error)) throw error

      const [areasResult, tablesResult] = await Promise.all([
        supabase.from('areas').select('*').eq('branch_id', branchId).order('name'),
        supabase.from('tables').select('*, areas(name, color)').eq('branch_id', branchId).order('name')
      ])

      if (areasResult.error && !isMissingSchema(areasResult.error)) throw areasResult.error
      if (tablesResult.error && !isMissingSchema(tablesResult.error)) throw tablesResult.error

      const fallbackAreas = (areasResult.data || []).map(normalizeArea)
      const fallbackTables = (tablesResult.data || []).map(normalizeTable)
      const totalCapacity = fallbackTables.reduce((sum, table) => sum + Number(table.capacity || 0), 0)
      const occupiedCapacity = fallbackTables
        .filter((table) => table.status === 'occupied')
        .reduce((sum, table) => sum + Number(table.capacity || 0), 0)

      return {
        areas: fallbackAreas,
        tables: fallbackTables,
        metrics: {
          total: fallbackTables.length,
          available: fallbackTables.filter((table) => table.status === 'available').length,
          occupied: fallbackTables.filter((table) => table.status === 'occupied').length,
          reserved: fallbackTables.filter((table) => table.status === 'reserved').length,
          maintenance: fallbackTables.filter((table) => table.status === 'maintenance').length,
          totalCapacity,
          occupiedCapacity,
          utilizationRate: totalCapacity > 0 ? (occupiedCapacity / totalCapacity) * 100 : 0
        }
      }
    }

    const metrics = data?.metrics || {}
    const totalCapacity = Number(metrics.totalCapacity || metrics.totalcapacity || 0)
    const occupiedCapacity = Number(metrics.occupiedCapacity || metrics.occupiedcapacity || 0)

    return {
      areas: (data?.areas || []).map(normalizeArea),
      tables: (data?.tables || []).map(normalizeTable),
      metrics: {
        total: Number(metrics.total || 0),
        available: Number(metrics.available || 0),
        occupied: Number(metrics.occupied || 0),
        reserved: Number(metrics.reserved || 0),
        maintenance: Number(metrics.maintenance || 0),
        totalCapacity,
        occupiedCapacity,
        utilizationRate: totalCapacity > 0 ? (occupiedCapacity / totalCapacity) * 100 : 0
      }
    }
  },

  async saveArea(area, branchId) {
    if (!branchId && !area?.branch_id) throw new Error('Selecciona una sucursal antes de guardar el area.')
    if (!area?.name?.trim()) throw new Error('El nombre del area es obligatorio.')
    const data = await rpcOrThrow('save_area', { p_area: areaPayload(area, branchId) }, 'guardar el area')
    return normalizeArea(data)
  },

  async saveTable(table, branchId) {
    if (!branchId && !table?.branch_id) throw new Error('Selecciona una sucursal antes de guardar la mesa.')
    if (!table?.area_id) throw new Error('Selecciona un area para la mesa.')
    if (!table?.name?.trim()) throw new Error('El nombre de la mesa es obligatorio.')
    const data = await rpcOrThrow('save_table', { p_table: tablePayload(table, branchId) }, 'guardar la mesa')
    return normalizeTable(data)
  },

  async updateTablePosition(tableId, { x_pos, y_pos, rotation = 0 }) {
    const data = await rpcOrThrow('update_table_position', {
      p_table_id: tableId,
      p_x_pos: Number(x_pos),
      p_y_pos: Number(y_pos),
      p_rotation: Number(rotation || 0)
    }, 'guardar la posicion de la mesa')
    return normalizeTable(data)
  },

  async deactivateArea(areaId) {
    return rpcOrThrow('deactivate_area', { p_area_id: areaId }, 'desactivar el area')
  },

  async deactivateTable(tableId) {
    return rpcOrThrow('deactivate_table', { p_table_id: tableId }, 'desactivar la mesa')
  },

  async setTableStatus(tableId, status) {
    const data = await rpcOrThrow('set_table_status', { p_table_id: tableId, p_status: status }, 'actualizar el estado de la mesa')
    return normalizeTable(data)
  },

  async getOrderDetails(orderId) {
    if (!orderId) return []
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name, price)')
      .eq('order_id', orderId)

    if (error) throw error
    return data || []
  }
}
