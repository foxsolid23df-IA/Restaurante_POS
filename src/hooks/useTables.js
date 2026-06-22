import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useBranchStore } from '@/store/branchStore'
import { salonApi } from '@/features/salon/api/salonApi'

export function useTables() {
  const { currentBranch } = useBranchStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tables, setTables] = useState([])
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [metrics, setMetrics] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    maintenance: 0,
    totalCapacity: 0,
    occupiedCapacity: 0,
    utilizationRate: 0
  })

  const loadLayout = useCallback(async () => {
    if (!currentBranch?.id) {
      setAreas([])
      setTables([])
      setMetrics({
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0,
        totalCapacity: 0,
        occupiedCapacity: 0,
        utilizationRate: 0
      })
      return { areas: [], tables: [], error: null }
    }

    setLoading(true)
    setError(null)
    try {
      const layout = await salonApi.getLayout(currentBranch.id)
      setAreas(layout.areas)
      setTables(layout.tables)
      setMetrics(layout.metrics)
      return { ...layout, error: null }
    } catch (err) {
      const message = err.message || 'Error al cargar el salon'
      setError(message)
      return { areas: [], tables: [], error: message }
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const fetchAreas = useCallback(async () => {
    const result = await loadLayout()
    return { areas: result.areas || [], error: result.error || null }
  }, [loadLayout])

  const fetchTables = useCallback(async (filters = {}) => {
    const result = await loadLayout()
    let nextTables = result.tables || []
    if (filters.area_id) nextTables = nextTables.filter((table) => table.area_id === filters.area_id)
    if (filters.status) nextTables = nextTables.filter((table) => table.status === filters.status)
    if (filters.capacity_min) nextTables = nextTables.filter((table) => table.capacity >= filters.capacity_min)
    if (filters.capacity_max) nextTables = nextTables.filter((table) => table.capacity <= filters.capacity_max)
    return { tables: nextTables, error: result.error || null }
  }, [loadLayout])

  const fetchTablesByArea = useCallback((areaId) => fetchTables({ area_id: areaId }), [fetchTables])

  const createArea = useCallback(async (areaData) => {
    setLoading(true)
    setError(null)
    try {
      const area = await salonApi.saveArea(areaData, currentBranch?.id)
      await loadLayout()
      return { area, error: null }
    } catch (err) {
      const message = err.message || 'Error al crear area'
      setError(message)
      return { area: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id, loadLayout])

  const updateArea = useCallback(async (areaId, updates) => {
    setLoading(true)
    setError(null)
    try {
      const existing = areas.find((area) => area.id === areaId) || {}
      const area = await salonApi.saveArea({ ...existing, ...updates, id: areaId }, currentBranch?.id)
      await loadLayout()
      return { area, error: null }
    } catch (err) {
      const message = err.message || 'Error al actualizar area'
      setError(message)
      return { area: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [areas, currentBranch?.id, loadLayout])

  const deleteArea = useCallback(async (areaId) => {
    setLoading(true)
    setError(null)
    try {
      await salonApi.deactivateArea(areaId)
      await loadLayout()
      return { success: true, error: null }
    } catch (err) {
      const message = err.message || 'Error al desactivar area'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [loadLayout])

  const createTable = useCallback(async (tableData) => {
    setLoading(true)
    setError(null)
    try {
      const table = await salonApi.saveTable(tableData, currentBranch?.id)
      await loadLayout()
      return { table, error: null }
    } catch (err) {
      const message = err.message || 'Error al crear mesa'
      setError(message)
      return { table: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id, loadLayout])

  const updateTable = useCallback(async (tableId, updates) => {
    setLoading(true)
    setError(null)
    try {
      const existing = tables.find((table) => table.id === tableId) || {}
      const table = await salonApi.saveTable({ ...existing, ...updates, id: tableId }, currentBranch?.id)
      await loadLayout()
      return { table, error: null }
    } catch (err) {
      const message = err.message || 'Error al actualizar mesa'
      setError(message)
      return { table: null, error: message }
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id, loadLayout, tables])

  const updateTablePosition = useCallback(async (tableId, position) => {
    try {
      const table = await salonApi.updateTablePosition(tableId, position)
      setTables((prev) => prev.map((row) => (row.id === tableId ? { ...row, ...table } : row)))
      return { table, error: null }
    } catch (err) {
      const message = err.message || 'Error al guardar posicion'
      setError(message)
      return { table: null, error: message }
    }
  }, [])

  const deleteTable = useCallback(async (tableId) => {
    setLoading(true)
    setError(null)
    try {
      await salonApi.deactivateTable(tableId)
      await loadLayout()
      return { success: true, error: null }
    } catch (err) {
      const message = err.message || 'Error al desactivar mesa'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [loadLayout])

  const setTableStatus = useCallback(async (tableId, status) => {
    try {
      const table = await salonApi.setTableStatus(tableId, status)
      await loadLayout()
      return { table, error: null }
    } catch (err) {
      const message = err.message || 'Error al cambiar estado de mesa'
      setError(message)
      return { table: null, error: message }
    }
  }, [loadLayout])

  const occupyTable = useCallback((tableId) => setTableStatus(tableId, 'occupied'), [setTableStatus])
  const releaseTable = useCallback((tableId) => setTableStatus(tableId, 'available'), [setTableStatus])
  const reserveTable = useCallback((tableId) => setTableStatus(tableId, 'reserved'), [setTableStatus])

  const getTableById = useCallback(async (tableId) => {
    const table = tables.find((row) => row.id === tableId)
    return { table: table || null, error: table ? null : 'Mesa no encontrada' }
  }, [tables])

  const getAvailableTables = useCallback(async (capacity) => {
    const availableTables = tables.filter((table) => (
      table.status === 'available' && (!capacity || table.capacity >= capacity)
    ))
    return { tables: availableTables, error: null }
  }, [tables])

  useEffect(() => {
    loadLayout()
  }, [loadLayout])

  useEffect(() => {
    if (!currentBranch?.id) return undefined

    const channel = supabase
      .channel(`tables_changes_${currentBranch.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => loadLayout()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'areas' },
        () => loadLayout()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentBranch?.id, loadLayout])

  const filteredTables = selectedArea
    ? tables.filter((table) => table.area_id === selectedArea)
    : tables

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
    updateTablePosition,
    deleteTable,
    getTableById,
    getAvailableTables,
    occupyTable,
    releaseTable,
    reserveTable,
    loadLayout
  }
}

export const useTablesByArea = (areaId) => {
  const tables = useTables().tables
  return tables.filter((table) => table.area_id === areaId)
}

export const useAvailableTables = () => {
  const tables = useTables().tables
  return tables.filter((table) => table.status === 'available')
}

export const useOccupiedTables = () => {
  const tables = useTables().tables
  return tables.filter((table) => table.status === 'occupied')
}

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
    available: 'OK',
    occupied: 'OC',
    reserved: 'RS',
    maintenance: 'MT'
  }
  return iconMap[status] || 'MS'
}

export default useTables
