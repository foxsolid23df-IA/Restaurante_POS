import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Save, Scale, DollarSign, AlertCircle, Loader2 } from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { toast } from 'sonner'

export default function InventoryModal({ item, onClose, onSave }) {
  const { currentBranch } = useBranchStore()
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_stock: '',
    min_stock: '',
    cost_per_unit: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        unit: item.unit,
        current_stock: item.current_stock,
        min_stock: item.min_stock,
        cost_per_unit: item.cost_per_unit || ''
      })
    }
  }, [item])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        branch_id: currentBranch.id,
        current_stock: parseFloat(formData.current_stock) || 0,
        min_stock: parseFloat(formData.min_stock) || 0,
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0
      }

      if (item) {
        const { error } = await supabase
          .from('inventory_items')
          .update(data)
          .eq('id', item.id)
        if (error) throw error
        toast.success(`Información de "${data.name}" actualizada`)
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert([data])
        if (error) throw error
        toast.success(`Item "${data.name}" agregado al inventario`)
      }

      onSave()
    } catch (error) {
      console.error('Error saving inventory item:', error)
      toast.error('No se pudo guardar el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-10 py-8 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {item ? 'Modificar Item' : 'Registro de Insumo'}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Sucursal: {currentBranch?.name || 'Cargando...'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Identificación del Producto</label>
            <div className="relative">
               <input
                 type="text"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-black text-slate-900 text-xl placeholder:text-slate-300 transition-all"
                 placeholder="Ej: Harina de Trigo Premium"
                 required
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                 <Scale size={12}/> Unidad Operativa
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-black text-slate-900 transition-all appearance-none cursor-pointer"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                 <DollarSign size={12}/> Costo x Unidad
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  className="w-full pl-12 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-black text-slate-900 text-xl transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Stock Disponible</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="w-full px-8 py-5 bg-emerald-50/30 border border-emerald-100 rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-black text-emerald-900 text-2xl transition-all"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Límite de Alerta (Min)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-8 py-5 bg-rose-50/30 border border-rose-100 rounded-[2rem] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none font-black text-rose-900 text-2xl transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] flex items-start gap-5 shadow-2xl shadow-slate-200">
            <div className="p-3 bg-white/10 rounded-2xl text-white">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight">Regla de Reabastecimiento</p>
              <p className="text-slate-400 font-medium text-sm mt-1 leading-relaxed">
                El sistema activará una alerta crítica cuando la existencia actual sea igual o menor a <span className="text-white font-bold">{formData.min_stock || 0} {formData.unit}</span>.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-6 text-slate-600 font-black hover:bg-slate-50 rounded-[2rem] transition-all text-xs uppercase tracking-[0.2em]"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-900 text-white px-8 py-6 rounded-[2rem] font-black hover:bg-black transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
              {loading ? 'Sincronizando...' : 'Guardar Información'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
