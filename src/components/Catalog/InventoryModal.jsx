import { useEffect, useState } from 'react'
import { X, Save, Scale, DollarSign, AlertCircle, Loader2 } from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'

export default function InventoryModal({ item, onClose, onSave }) {
  const { currentBranch } = useBranchStore()
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_stock: '',
    min_stock: '',
    cost_per_unit: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        unit: item.unit || 'kg',
        current_stock: item.current_stock ?? '',
        min_stock: item.min_stock ?? '',
        cost_per_unit: item.cost_per_unit ?? '',
        is_active: item.is_active !== false
      })
    }
  }, [item])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await inventoryApi.saveItem({ ...formData, id: item?.id }, currentBranch?.id)
      toast.success(item ? 'Insumo actualizado' : 'Insumo agregado al inventario')
      onSave()
    } catch (error) {
      console.error('Error saving inventory item:', error)
      toast.error(error.message || 'No se pudo guardar el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {item ? 'Editar insumo' : 'Nuevo insumo'}
            </h2>
            <p className="text-slate-500 font-medium text-sm">Sucursal: {currentBranch?.name || 'Sin sucursal'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-rose-50 rounded-md text-slate-500 hover:text-rose-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Nombre del insumo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-500 outline-none font-semibold text-slate-950"
              placeholder="Ej. Harina de trigo"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Scale size={14} /> Unidad operativa
              </label>
              <select
                value={formData.unit}
                onChange={(event) => setFormData({ ...formData, unit: event.target.value })}
                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-md focus:border-emerald-500 outline-none font-semibold text-slate-950"
                required
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="l">Litros (l)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="unit">Unidades (unit)</option>
                <option value="pz">Piezas (pz)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <DollarSign size={14} /> Costo por unidad
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_unit}
                onChange={(event) => setFormData({ ...formData, cost_per_unit: event.target.value })}
                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-md focus:border-emerald-500 outline-none font-semibold text-slate-950"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Stock disponible</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_stock}
                onChange={(event) => setFormData({ ...formData, current_stock: event.target.value })}
                className="w-full h-11 px-3 bg-emerald-50 border border-emerald-100 rounded-md focus:border-emerald-500 outline-none font-black text-emerald-950"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Mínimo de alerta</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock}
                onChange={(event) => setFormData({ ...formData, min_stock: event.target.value })}
                className="w-full h-11 px-3 bg-rose-50 border border-rose-100 rounded-md focus:border-rose-500 outline-none font-black text-rose-950"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
            <span>
              <span className="block font-black text-slate-950">Activo en inventario</span>
              <span className="block text-sm text-slate-500">Los insumos inactivos se conservan para historial.</span>
            </span>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
              className="h-5 w-5"
            />
          </label>

          <div className="bg-slate-950 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-white mt-0.5" />
            <p className="text-slate-300 text-sm">
              Las entradas, salidas y ajustes quedan auditados en Kardex. Editar este formulario cambia datos maestros y costo actual.
            </p>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 text-slate-600 font-black hover:bg-slate-50 rounded-md text-xs uppercase tracking-wide"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-950 text-white h-11 rounded-md font-black hover:bg-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
