import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'

// Components
import InventoryHeader from '@/components/Inventory/InventoryHeader'
import CriticalStockAlerts from '@/components/Inventory/CriticalStockAlerts'
import InventoryTable from '@/components/Inventory/InventoryTable'
import InventoryModal from '@/components/Catalog/InventoryModal' // Using the upgraded modal

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const { currentBranch } = useBranchStore()

  useEffect(() => {
    if (currentBranch?.id) {
      loadItems()
    }
  }, [currentBranch])

  const loadItems = async () => {
    if (!currentBranch?.id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
      toast.error('Error al sincronizar inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`¿Estás seguro de eliminar "${item.name}" del inventario?`)) return
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', item.id)
      if (error) throw error
      toast.success('Insumo eliminado correctamente')
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('No se pudo eliminar el registro')
    }
  }

  const criticalItems = items.filter(item => parseFloat(item.current_stock) <= parseFloat(item.min_stock))

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Analizando Existencias...</p>
      </div>
    )
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1700px] mx-auto bg-slate-50 min-h-screen">
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
      />

      {showModal && (
        <InventoryModal
          item={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={() => { loadItems(); setShowModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  )
}
