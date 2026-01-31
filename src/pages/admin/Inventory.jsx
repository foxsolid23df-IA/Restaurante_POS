import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Package, AlertTriangle, TrendingDown, ClipboardList, CheckCircle } from 'lucide-react'
import InventoryModal from '@/components/Inventory/InventoryModal'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { useBranchStore } from '@/store/branchStore'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const { alerts, resolveAlert } = useInventoryIntegration()
  const { currentBranch } = useBranchStore()

  useEffect(() => {
    if (currentBranch?.id) {
      loadItems()
    }
  }, [currentBranch])

  const loadItems = async () => {
    if (!currentBranch?.id) return
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id)
      if (error) throw error
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const criticalItems = items.filter(item => parseFloat(item.current_stock) <= parseFloat(item.min_stock))
  const healthyItemsCount = items.length - criticalItems.length

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Inventario</h1>
          <p className="text-slate-500 mt-2 font-medium">Control crítico de ingredientes y suministros</p>
        </div>
        
        <div className="flex gap-4">
          <StatCard icon={<Package className="text-blue-500" />} label="Total Items" value={items.length} />
          <StatCard icon={<AlertTriangle className="text-red-500" />} label="Críticos" value={criticalItems.length} color="bg-red-50" />
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 font-bold"
          >
            <Plus size={20} />
            Agregar Item
          </button>
        </div>
      </header>

      {/* Alertas de Inventario Crítico */}
      {criticalItems.length > 0 && (
        <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Items por Agotarse</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {criticalItems.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-red-50 shadow-xl shadow-red-50/50 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-lg mb-1">{item.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full">Nivel Crítico</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Disponible:</span>
                      <span className="font-bold text-red-600">{item.current_stock} {item.unit}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (item.current_stock / item.min_stock) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingItem(item); setShowModal(true); }}
                  className="mt-6 w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all"
                >
                  Reabastecer
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabla Completa */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Lista Completa</h3>
          </div>
          <div className="flex gap-2">
            <FilterBadge active label="Todos" count={items.length} />
            <FilterBadge label="Críticos" count={criticalItems.length} danger />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ingrediente</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stock Actual</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stock Mínimo</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Costo</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => {
                const isCritical = parseFloat(item.current_stock) <= parseFloat(item.min_stock)
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Unidad: {item.unit}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-lg font-black ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-bold text-slate-400">{item.min_stock}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-700">${parseFloat(item.cost_per_unit || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${isCritical ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{isCritical ? 'CRÍTICO' : 'NORMAL'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

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

function StatCard({ icon, label, value, color = "bg-white" }) {
  return (
    <div className={`${color} px-8 py-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 min-w-[220px]`}>
      <div className="p-4 bg-slate-50/50 rounded-2xl border border-white">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function FilterBadge({ active, label, count, danger }) {
  return (
    <button className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
      active 
        ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
        : danger && count > 0
          ? 'bg-red-50 text-red-600 border-red-100'
          : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
    }`}>
      {label} ({count})
    </button>
  )
}
