import { FileText, Package, Save, Send, Trash2, Warehouse } from 'lucide-react'

const inputClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/10 text-xs font-black uppercase tracking-wide hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed'
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-wide hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed'

export default function NewPurchaseForm({
  newPurchase,
  setNewPurchase,
  cart,
  onUpdateCartItem,
  onRemoveFromCart,
  onSubmit,
  suppliers,
  loading
}) {
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0)
  const tax = subtotal * 0.16

  const submit = (status) => (event) => {
    event.preventDefault()
    onSubmit(status)
  }

  return (
    <form className="bg-white rounded-xl border border-slate-200 overflow-hidden" onSubmit={submit('ordered')}>
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-950">Nueva compra</h3>
          <p className="text-xs text-slate-500">Guarda borrador, registra pedido o recibe completo.</p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Proveedor">
          <select
            required
            value={newPurchase.supplier_id}
            onChange={(event) => setNewPurchase({ ...newPurchase, supplier_id: event.target.value })}
            className={inputClass}
          >
            <option value="">Seleccionar proveedor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name} {supplier.category ? `(${supplier.category})` : ''}</option>
            ))}
          </select>
        </Field>

        <Field label="Folio factura / ticket">
          <input
            type="text"
            value={newPurchase.invoice_number}
            onChange={(event) => setNewPurchase({ ...newPurchase, invoice_number: event.target.value })}
            placeholder="FAC-12345"
            className={inputClass}
          />
        </Field>

        <Field label="Fecha de compra">
          <input
            type="date"
            required
            value={newPurchase.purchase_date}
            onChange={(event) => setNewPurchase({ ...newPurchase, purchase_date: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Fecha esperada">
          <input
            type="date"
            value={newPurchase.expected_date || ''}
            onChange={(event) => setNewPurchase({ ...newPurchase, expected_date: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Método de pago">
          <select
            value={newPurchase.payment_method}
            onChange={(event) => setNewPurchase({ ...newPurchase, payment_method: event.target.value })}
            className={inputClass}
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta / transferencia</option>
            <option value="credit">Crédito</option>
          </select>
        </Field>

        <Field label="Estado de pago">
          <select
            value={newPurchase.payment_status || 'pending'}
            onChange={(event) => setNewPurchase({ ...newPurchase, payment_status: event.target.value })}
            className={inputClass}
          >
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
          </select>
        </Field>
      </div>

      <div className="px-5 pb-5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Notas</label>
        <textarea
          value={newPurchase.notes}
          onChange={(event) => setNewPurchase({ ...newPurchase, notes: event.target.value })}
          className={`${inputClass} mt-2 min-h-20 resize-none`}
          placeholder="Condiciones, caducidades, entrega, observaciones..."
        />
      </div>

      <div className="border-y border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-slate-950 flex items-center gap-2">
            <Warehouse size={18} />
            Insumos
          </h4>
          <span className="text-xs font-black text-slate-500">{cart.length} partidas</span>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {cart.map((item) => (
            <div key={item.inventory_item_id} className="grid grid-cols-1 lg:grid-cols-[1fr_120px_140px_120px_48px] gap-3 items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div>
                <p className="font-black text-slate-950">{item.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{item.unit}</p>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={item.quantity}
                onChange={(event) => onUpdateCartItem(item.inventory_item_id, 'quantity', Number(event.target.value))}
                className={inputClass}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.unit_cost}
                onChange={(event) => onUpdateCartItem(item.inventory_item_id, 'unit_cost', Number(event.target.value))}
                className={inputClass}
              />
              <div className="text-right font-black text-slate-950">
                ${(Number(item.quantity || 0) * Number(item.unit_cost || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <button type="button" onClick={() => onRemoveFromCart(item.inventory_item_id)} className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100" title="Quitar">
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg text-slate-400">
              <Package className="mx-auto mb-3" size={36} />
              <p className="font-black uppercase text-xs tracking-wide">Carrito vacío</p>
              <p className="text-xs">Agrega insumos desde el buscador lateral.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 bg-slate-950 text-white flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">Resumen</p>
          <p className="text-3xl font-black">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400">IVA estimado: ${tax.toFixed(2)}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button type="button" disabled={loading || cart.length === 0} onClick={submit('draft')} className={secondaryButtonClass}>
            <Save size={18} />
            Borrador
          </button>
          <button type="submit" disabled={loading || cart.length === 0 || !newPurchase.supplier_id} className={secondaryButtonClass}>
            <Send size={18} />
            Registrar pedido
          </button>
          <button type="button" disabled={loading || cart.length === 0 || !newPurchase.supplier_id} onClick={submit('received')} className={primaryButtonClass}>
            <Package size={18} />
            Recibir completo
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}
