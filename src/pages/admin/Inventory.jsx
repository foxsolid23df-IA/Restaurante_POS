import { Suspense, useState } from 'react'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { useInventoryData } from '@/features/inventory/hooks/useInventoryData'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Search, SlidersHorizontal } from 'lucide-react'

import InventoryHeader from '@/components/Inventory/InventoryHeader'
import CriticalStockAlerts from '@/components/Inventory/CriticalStockAlerts'
import InventoryTable from '@/components/Inventory/InventoryTable'
import InventoryModal from '@/components/Catalog/InventoryModal'
import StockAdjustmentModal from '@/components/Inventory/StockAdjustmentModal'
import MovementHistoryModal from '@/components/Inventory/MovementHistoryModal'

function InventoryContent() {
  const { currentBranch } = useBranchStore()
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    unit: 'all',
    active: 'active',
    missingCost: false
  })
  const { items, criticalItems, dashboard, alerts } = useInventoryData(currentBranch?.id, filters)
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory', currentBranch?.id] })
    queryClient.invalidateQueries({ queryKey: ['inventory-dashboard', currentBranch?.id] })
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts', currentBranch?.id] })
  }

  const handleDelete = async (item) => {
    if (!confirm(`¿Deseas retirar "${item.name}" del inventario? Si tiene historial se desactivará.`)) return
    try {
      const result = await inventoryApi.deleteOrDeactivateItem(item.id)
      toast.success(result.action === 'deactivated'
        ? 'Insumo desactivado para conservar su historial'
        : 'Insumo eliminado correctamente')
      reload()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(error.message || 'No se pudo retirar el registro')
    }
  }

  const handleReactivate = async (item) => {
    try {
      await inventoryApi.reactivateItem(item.id)
      toast.success('Insumo reactivado')
      reload()
    } catch (error) {
      toast.error(error.message || 'No se pudo reactivar el insumo')
    }
  }

  if (!currentBranch?.id) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Selecciona una sucursal para consultar inventario.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
      <InventoryHeader
        totalItems={items.length}
        criticalCount={criticalItems.length}
        dashboard={dashboard}
        onAddItem={() => {
          setEditingItem(null)
          setShowModal(true)
        }}
      />

      <section className="mb-5 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-center bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_140px_150px] gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Buscar insumo..."
              className="w-full h-11 rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald-500"
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold"
          >
            <option value="all">Todos los estados</option>
            <option value="critical">Crítico</option>
            <option value="warning">Preventivo</option>
            <option value="healthy">Saludable</option>
          </select>
          <select
            value={filters.unit}
            onChange={(event) => setFilters({ ...filters, unit: event.target.value })}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold"
          >
            <option value="all">Todas las unidades</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="l">l</option>
            <option value="ml">ml</option>
            <option value="pz">pz</option>
            <option value="unit">unit</option>
          </select>
          <select
            value={filters.active}
            onChange={(event) => setFilters({ ...filters, active: event.target.value })}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold"
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <button
          onClick={() => setFilters({ ...filters, missingCost: !filters.missingCost })}
          className={`h-11 px-4 rounded-md border text-sm font-black inline-flex items-center gap-2 ${filters.missingCost ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          <SlidersHorizontal size={16} />
          Sin costo
        </button>
      </section>

      {alerts.length > 0 && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-rose-800">
          <AlertTriangle size={20} className="mt-0.5" />
          <div>
            <p className="font-black">Hay {alerts.length} alerta{alerts.length === 1 ? '' : 's'} abierta{alerts.length === 1 ? '' : 's'} de inventario</p>
            <p className="text-sm">Prioriza reabastecimiento o ajustes antes de servicio.</p>
          </div>
        </div>
      )}

      <CriticalStockAlerts
        items={criticalItems}
        onReorder={(item) => {
          setEditingItem(item)
          setShowModal(true)
        }}
      />

      <InventoryTable
        items={items}
        onEdit={(item) => {
          setEditingItem(item)
          setShowModal(true)
        }}
        onDelete={handleDelete}
        onAdjust={(item) => {
          setEditingItem(item)
          setShowAdjustModal(true)
        }}
        onHistory={(item) => {
          setEditingItem(item)
          setShowHistoryModal(true)
        }}
        onReactivate={handleReactivate}
      />

      {showModal && (
        <InventoryModal
          item={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null) }}
          onSave={() => { reload(); setShowModal(false); setEditingItem(null) }}
        />
      )}

      {showAdjustModal && (
        <StockAdjustmentModal
          item={editingItem}
          onClose={() => { setShowAdjustModal(false); setEditingItem(null) }}
          onSave={() => { reload(); setShowAdjustModal(false); setEditingItem(null) }}
        />
      )}

      {showHistoryModal && (
        <MovementHistoryModal
          item={editingItem}
          onClose={() => { setShowHistoryModal(false); setEditingItem(null) }}
        />
      )}
    </div>
  )
}

export default function Inventory() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary mb-4" />
        <p className="font-black text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Sincronizando inventario...</p>
      </div>
    }>
      <InventoryContent />
    </Suspense>
  )
}
