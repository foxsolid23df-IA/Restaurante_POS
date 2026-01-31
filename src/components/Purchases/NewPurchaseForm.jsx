import { FileText, ShoppingCart, Trash2, Package } from 'lucide-react'

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
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
  }

  const total = calculateTotal()
  const tax = total * 0.16

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
          <FileText size={24} />
        </div>
        Detalles de la Factura
      </h3>
      
      <form onSubmit={onSubmit} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Proveedor</label>
            <select 
              required
              value={newPurchase.supplier_id}
              onChange={(e) => setNewPurchase({...newPurchase, supplier_id: e.target.value})}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
            >
              <option value="">Seleccionar Proveedor...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Folio de Factura / Ticket</label>
            <input 
              type="text"
              required
              value={newPurchase.invoice_number}
              onChange={(e) => setNewPurchase({...newPurchase, invoice_number: e.target.value})}
              placeholder="Ej: FAC-12345"
              className="bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Fecha de Compra</label>
            <input 
              type="date"
              required
              value={newPurchase.purchase_date}
              onChange={(e) => setNewPurchase({...newPurchase, purchase_date: e.target.value})}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Método de Pago</label>
            <select 
              value={newPurchase.payment_method}
              onChange={(e) => setNewPurchase({...newPurchase, payment_method: e.target.value})}
              className="bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta / Transferencia</option>
              <option value="credit">Crédito</option>
            </select>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100">
          <div className="flex items-center justify-between mb-8 px-4">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              Items en Carrito
              <span className="text-xs font-black text-primary bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                {cart.length} productos
              </span>
            </h4>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto px-4 custom-scrollbar">
            {cart.map((item) => (
              <div key={item.inventory_item_id} className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group hover:border-primary/20 transition-all shadow-sm hover:shadow-xl duration-300">
                <div className="flex-1">
                  <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{item.name}</p>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Insumo: #{item.inventory_item_id.substring(0,6)}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-widest">Cantidad ({item.unit})</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => onUpdateCartItem(item.inventory_item_id, 'quantity', parseFloat(e.target.value))}
                      className="w-28 bg-white border border-slate-200 rounded-2xl px-5 py-3 font-black text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-widest">Costo U.</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) => onUpdateCartItem(item.inventory_item_id, 'unit_cost', parseFloat(e.target.value))}
                        className="w-32 bg-white border border-slate-200 rounded-2xl pl-8 pr-5 py-3 font-black text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                    <p className="font-black text-slate-900 text-xl tracking-tighter">${(item.quantity * item.unit_cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onRemoveFromCart(item.inventory_item_id)}
                    className="p-4 text-rose-500 bg-white hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-slate-100 hover:border-rose-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                 <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                    <ShoppingCart size={40} />
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-widest text-sm">El carrito está vacío</p>
                 <p className="text-slate-300 font-medium text-xs mt-2 uppercase">Agrega insumos usando el buscador lateral</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Observaciones de Entrega</label>
          <textarea 
            value={newPurchase.notes}
            onChange={(e) => setNewPurchase({...newPurchase, notes: e.target.value})}
            placeholder="Especificaciones, status de caducidad o comentarios del transportista..."
            className="bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none h-32 placeholder:text-slate-300"
          />
        </div>

        <div className="pt-12 px-10 pb-10 flex flex-col md:flex-row justify-between items-center bg-slate-900 -mx-10 -mb-10 text-white gap-8 border-t-8 border-primary">
          <div className="text-center md:text-left">
            <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Resumen de Inversión</p>
            <div className="flex items-end gap-2">
               <span className="text-2xl font-black text-slate-500 mb-1">$</span>
               <p className="text-6xl font-black tracking-tighter">{total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex gap-4 mt-3 opacity-60">
               <p className="text-xs font-black uppercase tracking-widest">Base: ${total.toFixed(2)}</p>
               <p className="text-xs font-black uppercase tracking-widest">IVA (16%): ${tax.toFixed(2)}</p>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading || cart.length === 0 || !newPurchase.supplier_id}
            className="w-full md:w-auto bg-primary hover:bg-emerald-600 text-white px-12 py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
          >
            {loading ? (
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Package size={24} className="group-hover:rotate-12 transition-transform" />
                Registrar Ingreso
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
