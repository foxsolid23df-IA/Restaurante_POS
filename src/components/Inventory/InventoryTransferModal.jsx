import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, ArrowRight, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import { useAuthStore } from '@/store/authStore'

export default function InventoryTransferModal({ onClose, onSave }) {
  const { currentBranch, branches } = useBranchStore()
  const { profile } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [selectedToBranch, setSelectedToBranch] = useState('')
  const [transferItems, setTransferItems] = useState([{ inventory_item_id: '', quantity: 0 }])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('idle') // idle, success, error

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('branch_id', currentBranch.id)
      .gt('current_stock', 0)
      .order('name')
    setItems(data || [])
  }

  const handleAddItem = () => {
    setTransferItems([...transferItems, { inventory_item_id: '', quantity: 0 }])
  }

  const handleRemoveItem = (index) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const updated = [...transferItems]
    updated[index][field] = value
    setTransferItems(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedToBranch || transferItems.some(i => !i.inventory_item_id || i.quantity <= 0)) {
      alert('Por favor completa todos los campos correctamente')
      return
    }

    setLoading(true)
    try {
      // 1. Create Transfer Header
      const { data: transfer, error: tError } = await supabase
        .from('inventory_transfers')
        .insert({
          from_branch_id: currentBranch.id,
          to_branch_id: selectedToBranch,
          requested_by: profile.id,
          status: 'pending',
          notes
        })
        .select()
        .single()

      if (tError) throw tError

      // 2. Create Items
      const itemsToInsert = transferItems.map(item => ({
        transfer_id: transfer.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity
      }))

      const { error: iError } = await supabase
        .from('inventory_transfer_items')
        .insert(itemsToInsert)

      if (iError) throw iError

      setStatus('success')
      setTimeout(() => {
        onSave()
        onClose()
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">¡Transferencia Enviada!</h2>
          <p className="text-slate-500 font-medium">La sucursal de destino recibirá la notificación en breve.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Transferir Inventario</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Movimiento entre sucursales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900"><X size={24} /></button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
          {/* Sucursales Row */}
          <div className="bg-slate-50 rounded-[2rem] p-6 flex items-center justify-between border border-slate-100">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Desde</p>
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 text-center">
                <p className="font-black text-slate-900">{currentBranch?.name}</p>
              </div>
            </div>
            
            <div className="px-6 text-blue-600 animate-pulse">
              <ArrowRight size={24} strokeWidth={3} />
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Hacia</p>
              <select
                value={selectedToBranch}
                onChange={(e) => setSelectedToBranch(e.target.value)}
                className="w-full bg-white px-6 py-3 rounded-2xl border border-slate-200 font-black text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none text-center"
                required
              >
                <option value="">Seleccionar destino...</option>
                {branches.filter(b => b.id !== currentBranch.id).map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Items a transferir</h3>
              <button 
                type="button"
                onClick={handleAddItem}
                className="text-blue-600 font-black text-xs hover:underline uppercase"
              >
                + Añadir otro item
              </button>
            </div>

            <div className="space-y-3">
              {transferItems.map((ti, index) => (
                <div key={index} className="flex gap-3 group animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex-[3]">
                    <select
                      value={ti.inventory_item_id}
                      onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                      className="w-full bg-white px-5 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                      required
                    >
                      <option value="">Seleccionar item...</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.current_stock} {item.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Qtd"
                      value={ti.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full bg-white px-5 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50/50 transition-all text-center"
                      required
                    />
                  </div>
                  {transferItems.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Notas de la transferencia</label>
             <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-100/50 transition-all min-h-[100px]"
              placeholder="Motivo del traslado, detalles del transporte, etc..."
             />
          </div>
        </form>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all font-black uppercase text-xs tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Confirmar Transferencia'}
          </button>
        </div>
      </div>
    </div>
  )
}
