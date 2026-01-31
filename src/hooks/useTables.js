import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useBranchStore } from '@/store/branchStore'

// Hook principal
export function useTables() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tables, setTables] = useState([])
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const { currentBranch } = useBranchStore()

  // Obtener todas las áreas
  const fetchAreas = useCallback(async () => {
    if (!currentBranch?.id) return
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name')

      if (error) throw error

      setAreas(data || [])
      return { areas: data || [], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar áreas'
      setError(errorMessage)
      return { areas: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener todas las mesas
  const fetchTables = useCallback(async (filters = {}) => {
    if (!currentBranch?.id) return
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('tables')
        .select(`*`)
        .eq('branch_id', currentBranch.id)
        .order('name')

      // Aplicar filtros
      if (filters.area_id) {
        query = query.eq('area_id', filters.area_id)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.capacity_min) {
        query = query.gte('capacity', filters.capacity_min)
      }
      if (filters.capacity_max) {
        query = query.lte('capacity', filters.capacity_max)
      }

      const { data, error } = await query

      if (error) throw error

      const tablesWithOrders = await Promise.all(
        (data || []).map(async (table) => {
          // Obtener orden activa de la mesa
          const { data: activeOrder } = await supabase
            .from('orders')
            .select('id, status, created_at, total_amount')
            .eq('table_id', table.id)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            ...table,
            current_order: activeOrder
          }
        })
      )

      setTables(tablesWithOrders)
      return { tables: tablesWithOrders, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar mesas'
      setError(errorMessage)
      return { tables: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener mesas por área
  const fetchTablesByArea = useCallback(async (areaId) => {
    return fetchTables({ area_id: areaId })
  }, [fetchTables])

  // Crear nueva área
  const createArea = useCallback(async (areaData) => {
    setLoading(true)
    setError(null)
    
    try {
      if (!currentBranch?.id) {
        throw new Error('No hay una sucursal seleccionada. Por favor selecciona una sucursal primero.')
      }

      const { data, error } = await supabase
        .from('areas')
        .insert({
          ...areaData,
          branch_id: currentBranch.id
        })
        .select()
        .single()

      if (error) throw error

      setAreas(prev => [...prev, data])
      return { area: data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear área'
      setError(errorMessage)
      return { area: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar área
  const updateArea = useCallback(async (areaId, updates) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('areas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', areaId)
        .select()
        .single()

      if (error) throw error

      setAreas(prev => 
        prev.map(area => 
          area.id === areaId ? { ...area, ...data } : area
        )
      )

      return { area: data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar área'
      setError(errorMessage)
      return { area: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Eliminar área
  const deleteArea = useCallback(async (areaId) => {
    setLoading(true)
    setError(null)
    
    try {
      // Verificar que no haya mesas asociadas
      const { data: tablesCount } = await supabase
        .from('tables')
        .select('id', { count: 'exact' })
        .eq('area_id', areaId)

      if (tablesCount && tablesCount.length > 0) {
        throw new Error('No se puede eliminar el área porque tiene mesas asociadas')
      }

      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', areaId)

      if (error) throw error

      setAreas(prev => prev.filter(area => area.id !== areaId))
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar área'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nueva mesa


  // Actualizar mesa
  const updateTable = useCallback(async (tableId, updates) => {
    setLoading(true)
    setError(null)
    
    try {
      // Limpiar datos virtuales que no existen en la DB para evitar PGRST204
      const { current_order, areas, ...cleanUpdates } = updates

      const { data, error } = await supabase
        .from('tables')
        .update(cleanUpdates)
        .eq('id', tableId)
        .select(`
          *
        `)
        .single()

      if (error) {
        console.error('Supabase updateTable error:', error)
        throw error
      }

      setTables(prev => 
        prev.map(table => 
          table.id === tableId ? { ...table, ...data } : table
        )
      )

      return { table: data, error: null }
    } catch (err) {
      console.error('Catch updateTable error:', err)
      const errorMessage = err.message || 'Error al actualizar mesa'
      const errorCode = err.code || 'unknown'
      setError(`${errorMessage} (${errorCode})`)
      return { table: null, error: `${errorMessage} (${errorCode})` }
    } finally {
      setLoading(false)
    }
  }, [])

  // Similar detail for createArea/createTable
  const createTable = useCallback(async (tableData) => {
    setLoading(true)
    setError(null)
    
    try {
      if (!currentBranch?.id) {
        throw new Error('No hay una sucursal seleccionada')
      }

      // Limpiar datos virtuales
      const { current_order, areas, ...cleanData } = tableData

      const { data, error } = await supabase
        .from('tables')
        .insert({
          ...cleanData,
          branch_id: currentBranch.id,
          status: 'available'
        })
        .select(`*`)
        .single()

      if (error) {
        console.error('Supabase createTable error:', error)
        throw error
      }

      setTables(prev => [...prev, data])
      return { table: data, error: null }
    } catch (err) {
      console.error('Catch createTable error:', err)
      const errorMessage = err.message || 'Error al crear mesa'
      setError(`${errorMessage} (${err.code || ''})`)
      return { table: null, error: `${errorMessage} (${err.code || ''})` }
    } finally {
      setLoading(false)
    }
  }, [currentBranch])

  // Eliminar mesa
  const deleteTable = useCallback(async (tableId) => {
    setLoading(true)
    setError(null)
    
    try {
      // Verificar que no haya órdenes activas
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('table_id', tableId)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])

      if (activeOrders && activeOrders.length > 0) {
        throw new Error('No se puede eliminar la mesa porque tiene órdenes activas')
      }

      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error

      setTables(prev => prev.filter(table => table.id !== tableId))
      return { success: true, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar mesa'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Ocupar mesa
  const occupyTable = useCallback(async (tableId) => {
    return updateTable(tableId, { status: 'occupied' })
  }, [updateTable])

  // Liberar mesa
  const releaseTable = useCallback(async (tableId) => {
    return updateTable(tableId, { status: 'available' })
  }, [updateTable])

  // Reservar mesa
  const reserveTable = useCallback(async (tableId) => {
    return updateTable(tableId, { status: 'reserved' })
  }, [updateTable])

  // Obtener mesa por ID
  const getTableById = useCallback(async (tableId) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .select(`*`)
        .eq('id', tableId)
        .single()

      if (error) throw error

      // Obtener orden activa
      const { data: activeOrder } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount')
        .eq('table_id', tableId)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const tableWithOrder = {
        ...data,
        current_order: activeOrder
      }

      return { table: tableWithOrder, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener mesa'
      setError(errorMessage)
      return { table: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Obtener mesas disponibles
  const getAvailableTables = useCallback(async (capacity) => {
    const filters = { status: 'available' }
    if (capacity) {
      filters.capacity_min = capacity
    }
    return fetchTables(filters)
  }, [fetchTables])

  // Cargar datos iniciales
  useEffect(() => {
    fetchAreas()
    fetchTables()
  }, [fetchAreas, fetchTables])

  // Suscripción en tiempo real para cambios en mesas
  useEffect(() => {
    const channel = supabase
      .channel('tables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables'
        },
        async (payload) => {
          console.log('Cambio en mesas detectado:', payload)
          
          if (payload.new?.id) {
            const { table } = await getTableById(payload.new.id)
            if (table) {
              setTables(prev => {
                const existingIndex = prev.findIndex(t => t.id === table.id)
                if (existingIndex >= 0) {
                  const updated = [...prev]
                  updated[existingIndex] = table
                  return updated
                }
                return [...prev, table]
              })
            }
          }
          
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setTables(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [getTableById])

  // Mesas filtradas por área seleccionada
  const filteredTables = selectedArea 
    ? tables.filter(table => table.area_id === selectedArea)
    : tables

  // Métricas útiles
  const metrics = useMemo(() => {
    const total = tables.length
    const available = tables.filter(t => t.status === 'available').length
    const occupied = tables.filter(t => t.status === 'occupied').length
    const reserved = tables.filter(t => t.status === 'reserved').length
    const maintenance = tables.filter(t => t.status === 'maintenance').length
    
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0)
    const occupiedCapacity = tables
      .filter(t => t.status === 'occupied')
      .reduce((sum, table) => sum + table.capacity, 0)

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      totalCapacity,
      occupiedCapacity,
      utilizationRate: totalCapacity > 0 ? (occupiedCapacity / totalCapacity) * 100 : 0
    }
  }, [tables])

  return {
    loading,
    error,
    tables: filteredTables,
    allTables: tables,
    areas,
    selectedArea,
    metrics,
    setSelectedArea,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
    fetchTables,
    fetchTablesByArea,
    createTable,
    updateTable,
    deleteTable,
    getTableById,
    getAvailableTables,
    occupyTable,
    releaseTable,
    reserveTable
  }
}

// Selectores personalizados
export const useTablesByArea = (areaId) => {
  const tables = useTables().tables
  return tables.filter(table => table.area_id === areaId)
}

export const useAvailableTables = () => {
  const tables = useTables().tables
  return tables.filter(table => table.status === 'available')
}

export const useOccupiedTables = () => {
  const tables = useTables().tables
  return tables.filter(table => table.status === 'occupied')
}

// Helper functions
export const formatTableStatus = (status) => {
  const statusMap = {
    available: 'Disponible',
    occupied: 'Ocupada',
    reserved: 'Reservada',
    maintenance: 'Mantenimiento'
  }
  return statusMap[status] || status
}

export const getStatusColorClass = (status) => {
  const colorMap = {
    available: 'bg-green-100 text-green-800 border-green-200',
    occupied: 'bg-red-100 text-red-800 border-red-200',
    reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    maintenance: 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getTableIcon = (status) => {
  const iconMap = {
    available: '✅',
    occupied: '🔴',
    reserved: '🟡',
    maintenance: '⚙️'
  }
  return iconMap[status] || '📍'
}

export default useTables