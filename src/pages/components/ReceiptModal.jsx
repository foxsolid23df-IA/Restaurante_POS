import { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { useBranchStore } from '@/store/branchStore'
import { useAuthStore } from '@/store/authStore'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function ReceiptModal({
  isOpen,
  onClose,
  forecastItems = [],
  onSuccess
}) {
  const { currentBranch } = useBranchStore()
  const { profile } = useAuthStore()
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return
      const toBuy = forecastItems
        .filter(item => Number(item.toBuy || 0) > 0)
        .map(item => ({
          ...item,
          receivedQuantity: Number(item.toBuy || 0),
          receivedCost: Number(item.costPerUnit || 0)
        }))
      setItems(toBuy)

      const data = await inventoryApi.getSuppliers(currentBranch?.id)
      setSuppliers(data || [])
      if (data?.length > 0) setSelectedSupplier(data[0].id)
    }

    load()
  }, [isOpen, forecastItems, currentBranch?.id])

  const handleUpdateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: Number.parseFloat(value) || 0 } : item
    ))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.receivedQuantity * item.receivedCost), 0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await inventoryApi.createPurchase({
        supplier_id: selectedSupplier,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        tax_amount: totalAmount * 0.16,
        notes,
        status: 'pending',
        payment_method: 'cash',
        payment_status: 'paid',
        purchase_date: new Date().toISOString(),
        user_id: profile?.id || null
      }, items.map((item) => ({
        inventory_item_id: item.id,
        quantity: item.receivedQuantity,
        unit_cost: item.receivedCost
      })), currentBranch?.id)

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-black text-slate-950">Registrar recepción sugerida</h2>
            <p className="text-slate-500 text-sm font-semibold">Entrada transaccional a inventario y Kardex.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-md text-slate-500 hover:text-rose-600 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Proveedor</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(event) => setSelectedSupplier(event.target.value)}
                  className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm font-bold text-slate-950"
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Factura / remisión</label>
                <input
                  type="text"
                  placeholder="Ej. FAC-12345"
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm font-bold text-slate-950"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-3 text-left font-black text-slate-500">Insumo</th>
                    <th className="px-4 py-3 text-center font-black text-slate-500">Unidad</th>
                    <th className="px-4 py-3 text-center font-black text-slate-500">Cantidad</th>
                    <th className="px-4 py-3 text-right font-black text-slate-500">Costo</th>
                    <th className="px-4 py-3 text-right font-black text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-bold text-slate-950">{item.name}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-bold">{item.unit}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.receivedQuantity}
                          onChange={(event) => handleUpdateItem(item.id, 'receivedQuantity', event.target.value)}
                          className="w-24 mx-auto block bg-white border border-slate-200 rounded-md px-3 py-2 text-center font-black text-blue-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.receivedCost}
                          onChange={(event) => handleUpdateItem(item.id, 'receivedCost', event.target.value)}
                          className="w-28 bg-white border border-slate-200 rounded-md px-3 py-2 text-right font-black text-slate-950"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-950">
                        {currency.format(item.receivedQuantity * item.receivedCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="p-10 text-center text-slate-500 font-bold">
                  No hay insumos sugeridos para recibir.
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">Notas</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones de proveedor, caducidad o entrega..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-3 text-sm font-bold text-slate-950"
                rows={2}
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Total de recepción</p>
              <p className="text-2xl font-black text-blue-700">{currency.format(totalAmount)}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-11 bg-white text-slate-600 rounded-md font-black text-sm hover:bg-slate-100 transition-all border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="px-6 h-11 bg-blue-700 text-white rounded-md font-black text-sm hover:bg-blue-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : (
                  <>
                    <Check size={18} />
                    Completar recepción
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
