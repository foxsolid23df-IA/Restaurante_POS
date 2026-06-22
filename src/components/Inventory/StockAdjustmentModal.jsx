import { useState } from 'react'
import { X, Save, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'

export default function StockAdjustmentModal({ item, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'entry',
    quantity: '',
    reason: 'Ajuste manual'
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const qty = Number.parseFloat(formData.quantity)
    if (!qty || qty <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }
    if (!formData.reason?.trim()) {
      toast.error('El motivo del ajuste es obligatorio')
      return
    }

    setLoading(true)
    try {
      await inventoryApi.adjustStock({
        itemId: item.id,
        quantityDelta: formData.type === 'entry' ? qty : -qty,
        reason: `${formData.reason} (${formData.type === 'entry' ? '+' : '-'}${qty} ${item.unit})`,
        movementType: formData.type === 'entry' ? 'entry' : 'exit'
      })

      toast.success('Ajuste registrado en Kardex')
      onSave()
    } catch (error) {
      console.error('Error in stock adjustment:', error)
      toast.error(error.message || 'No se pudo procesar el ajuste')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-black text-slate-950">Ajustar existencia</h2>
            <p className="text-slate-500 font-bold text-sm">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-rose-50 rounded-md text-slate-500 hover:text-rose-600 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-md gap-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'entry' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-md font-black text-xs uppercase tracking-wide transition-all ${
                formData.type === 'entry' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <TrendingUp size={16} />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'exit' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-md font-black text-xs uppercase tracking-wide transition-all ${
                formData.type === 'exit' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <TrendingDown size={16} />
              Salida
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 p-4 bg-slate-50">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Actual</p>
              <p className="text-2xl font-black text-slate-950">{Number(item.current_stock || 0).toFixed(2)} {item.unit}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Después</p>
              <p className="text-2xl font-black text-slate-950">
                {Math.max(0, Number(item.current_stock || 0) + (formData.type === 'entry' ? 1 : -1) * (Number(formData.quantity || 0))).toFixed(2)} {item.unit}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Cantidad ({item.unit})</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.quantity}
              onChange={(event) => setFormData({ ...formData, quantity: event.target.value })}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-500 outline-none font-black text-slate-950"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Motivo</label>
            <select
              value={formData.reason}
              onChange={(event) => setFormData({ ...formData, reason: event.target.value })}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-md focus:border-emerald-500 outline-none font-black text-slate-950"
            >
              <option value="Ajuste manual">Ajuste manual</option>
              {formData.type === 'entry' ? (
                <>
                  <option value="Compra inmediata">Compra inmediata</option>
                  <option value="Devolución">Devolución</option>
                  <option value="Excedente encontrado">Excedente encontrado</option>
                </>
              ) : (
                <>
                  <option value="Merma / desperdicio">Merma / desperdicio</option>
                  <option value="Consumo interno">Consumo interno</option>
                  <option value="Donación">Donación</option>
                  <option value="Caducidad">Caducidad</option>
                </>
              )}
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 font-black text-slate-500 hover:bg-slate-50 rounded-md text-xs uppercase tracking-wide"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-950 text-white h-11 rounded-md font-black hover:bg-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Confirmar ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
