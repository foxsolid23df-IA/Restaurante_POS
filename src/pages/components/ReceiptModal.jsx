import React, { useState, useEffect } from 'react'
import { X, Check, Package, DollarSign, Tag, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ReceiptModal({ 
  isOpen, 
  onClose, 
  forecastItems = [], 
  onSuccess 
}) {
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Filtrar solo items que sugirieron compra
      const toBuy = forecastItems
        .filter(item => item.toBuy > 0)
        .map(item => ({
          ...item,
          receivedQuantity: item.toBuy,
          receivedCost: item.costPerUnit
        }))
      setItems(toBuy)
      fetchSuppliers()
    }
  }, [isOpen, forecastItems])

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').eq('is_active', true)
    setSuppliers(data || [])
    if (data?.length > 0) setSelectedSupplier(data[0].id)
  }

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item
    ))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.receivedQuantity * item.receivedCost), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Crear la Compra
      const { data: purchase, error: pError } = await supabase
        .from('purchases')
        .insert([{
          supplier_id: selectedSupplier,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          notes: notes,
          status: 'completed'
        }])
        .select()
        .single()

      if (pError) throw pError

      // 2. Crear los items de la compra y actualizar inventario
      for (const item of items) {
        // Registrar item de compra
        await supabase.from('purchase_items').insert({
          purchase_id: purchase.id,
          inventory_item_id: item.id,
          quantity: item.receivedQuantity,
          unit_cost: item.receivedCost,
          total_cost: item.receivedQuantity * item.receivedCost
        })

        // Obtener stock actual para el log
        const { data: inv } = await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', item.id)
          .single()
        
        const oldStock = parseFloat(inv.current_stock || 0)
        const newStock = oldStock + item.receivedQuantity

        // Actualizar inventario
        await supabase.from('inventory_items').update({
          current_stock: newStock,
          cost_per_unit: item.receivedCost // Actualizamos al costo de esta recepción
        }).eq('id', item.id)

        // Registrar en log
        await supabase.from('inventory_log').insert({
          inventory_item_id: item.id,
          old_stock: oldStock,
          new_stock: newStock,
          quantity_used: -item.receivedQuantity,
          reason: `Recepción de pedido - Factura: ${invoiceNumber || 'S/N'}`
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error al registrar recepción:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registrar Recepción de Pedido</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Ingreso automático a inventario y actualización de costos</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-8 overflow-y-auto space-y-8 flex-1">
            {/* Supplier & Ref */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Proveedor</label>
                <select 
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">№ Factura / Remisión</label>
                <input 
                  type="text"
                  placeholder="Ej: FAC-12345"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 italic">Confirmar Cantidades y Costos Reales</h3>
              <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                <table className="w-full text-sm">
                   <thead>
                     <tr className="bg-slate-100/50">
                       <th className="px-6 py-4 text-left font-black text-slate-500">Item</th>
                       <th className="px-6 py-4 text-center font-black text-slate-500">Unidad</th>
                       <th className="px-6 py-4 text-center font-black text-slate-500">Cant. Recibida</th>
                       <th className="px-6 py-4 text-right font-black text-slate-500">Costo Unit.</th>
                       <th className="px-6 py-4 text-right font-black text-slate-500">Subtotal</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {items.map(item => (
                       <tr key={item.id}>
                         <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                         <td className="px-6 py-4 text-center text-slate-400 font-bold uppercase text-[10px]">{item.unit}</td>
                         <td className="px-6 py-4">
                           <input 
                             type="number"
                             step="0.01"
                             value={item.receivedQuantity}
                             onChange={(e) => handleUpdateItem(item.id, 'receivedQuantity', e.target.value)}
                             className="w-24 mx-auto block bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                           />
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-400">$</span>
                              <input 
                               type="number"
                               step="0.01"
                               value={item.receivedCost}
                               onChange={(e) => handleUpdateItem(item.id, 'receivedCost', e.target.value)}
                               className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-right font-black text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                             />
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right font-black text-slate-900 bg-slate-100/30">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.receivedQuantity * item.receivedCost)}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Notas Adicionales</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre el estado de los productos o el proveedor..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  rows={2}
                />
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="text-right flex-1 pr-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Recepción</p>
               <p className="text-3xl font-black text-blue-600">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}
               </p>
            </div>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-4 bg-white text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all border border-slate-200"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading || items.length === 0}
                className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : (
                  <>
                    <Check size={20} />
                    Completar Recepción
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
