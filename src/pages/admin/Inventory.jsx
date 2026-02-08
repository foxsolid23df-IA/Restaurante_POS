import { Suspense, useState } from 'react'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { useInventoryData } from '@/features/inventory/hooks/useInventoryData'
import { useQueryClient } from '@tanstack/react-query'

// Components
import InventoryHeader from '@/components/Inventory/InventoryHeader'
import CriticalStockAlerts from '@/components/Inventory/CriticalStockAlerts'
import InventoryTable from '@/components/Inventory/InventoryTable'
import InventoryModal from '@/components/Catalog/InventoryModal'
import StockAdjustmentModal from '@/components/Inventory/StockAdjustmentModal'
import MovementHistoryModal from '@/components/Inventory/MovementHistoryModal'

function InventoryContent() {
  const { currentBranch } = useBranchStore()
  const { items, criticalItems } = useInventoryData(currentBranch?.id)
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory', currentBranch?.id] })
  }

  const handleDelete = async (item) => {
    if (!confirm(`¿Estás seguro de eliminar "${item.name}" del inventario?`)) return
    try {
      await inventoryApi.deleteItem(item.id)
      toast.success('Insumo eliminado correctamente')
      reload()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('No se pudo eliminar el registro')
    }
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1700px] mx-auto bg-[#f8fafc] min-h-screen">
      <InventoryHeader 
        totalItems={items.length} 
        criticalCount={criticalItems.length}
        onAddItem={() => { 
          setEditingItem(null); 
          setShowModal(true); 
        }}
      />

      <CriticalStockAlerts 
        items={criticalItems} 
        onReorder={(item) => {
          setEditingItem(item);
          setShowModal(true);
        }}
      />

      <InventoryTable 
        items={items}
        onEdit={(item) => {
          setEditingItem(item);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onAdjust={(item) => {
          setEditingItem(item);
          setShowAdjustModal(true);
        }}
        onHistory={(item) => {
          setEditingItem(item);
          setShowHistoryModal(true);
        }}
      />

      {showModal && (
        <InventoryModal
          item={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={() => { reload(); setShowModal(false); setEditingItem(null); }}
        />
      )}

      {showAdjustModal && (
        <StockAdjustmentModal
          item={editingItem}
          onClose={() => { setShowAdjustModal(false); setEditingItem(null); }}
          onSave={() => { reload(); setShowAdjustModal(false); setEditingItem(null); }}
        />
      )}

      {showHistoryModal && (
        <MovementHistoryModal
          item={editingItem}
          onClose={() => { setShowHistoryModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  )
}

export default function Inventory() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary mb-4" />
        <p className="font-black text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Sincronizando Inventario...</p>
      </div>
    }>
      <InventoryContent />
    </Suspense>
  )
}
