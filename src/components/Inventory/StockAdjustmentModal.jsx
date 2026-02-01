import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Save, TrendingUp, TrendingDown, Clipboard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import useInventoryIntegration from '@/hooks/useInventoryIntegration'

export default function StockAdjustmentModal({ item, onClose, onSave }) {
  const { updateInventoryStock } = useInventoryIntegration()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'entry', // entry or exit
    quantity: '',
    reason: 'Ajuste Manual'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const qty = parseFloat(formData.quantity)
    if (!qty || qty <= 0) {
      toast.error('Ingrese una cantidad válida')
      return
    }

    setLoading(true)
    try {
      const currentStock = parseFloat(item.current_stock)
      const adjustment = formData.type === 'entry' ? qty : -qty
      const newStock = Math.max(0, currentStock + adjustment)
      
      await updateInventoryStock(
        item.id,
        newStock,
        `${formData.reason} (${formData.type === 'entry' ? '+' : '-'}${qty} ${item.unit})`
      )

      toast.success('Ajuste de stock aplicado correctamente')
      onSave()
    } catch (error) {
      console.error('Error in stock adjustment:', error)
      toast.error('No se pudo procesar el ajuste')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl border border-white/20 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ajustar Existencia</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="flex bg-slate-100 p-2 rounded-3xl gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'entry' })}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                formData.type === 'entry' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white'
              }`}
            >
              <TrendingUp size={16} />
              Entrada (+)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'exit' })}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                formData.type === 'exit' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white'
              }`}
            >
              <TrendingDown size={16} />
              Salida (-)
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cantidad a Ajustar ({item.unit})</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-black text-slate-900 text-2xl transition-all"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Motivo del Ajuste</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-black text-slate-900 transition-all appearance-none cursor-pointer"
            >
              <option value="Ajuste Manual">Ajuste Manual General</option>
              {formData.type === 'entry' ? (
                <>
                  <option value="Compra Inmediata">Compra Inmediata</option>
                  <option value="Devolución">Devolución de Cliente</option>
                  <option value="Excedente">Excedente Encontrado</option>
                </>
              ) : (
                <>
                  <option value="Merma/Desperdicio">Merma / Desperdicio</option>
                  <option value="Consumo Interno">Consumo Interno</option>
                  <option value="Donación">Donación</option>
                  <option value="Caducidad">Producto Caducado</option>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 font-black text-slate-400 hover:text-slate-600 rounded-2xl text-xs uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
              Confirmar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
