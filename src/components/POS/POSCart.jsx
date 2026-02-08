import { useRolePermissions } from '@/hooks/useRolePermissions'

export default function POSCart({ 
  cart, 
  totals, 
  isEmpty, 
  onRemove, 
  onUpdateQuantity, 
  onCheckout, 
  onPrintPreCheck, 
  loading, 
  printingLoading,
  selectedTable, // Needed to disable checkout if no table selected
  taxName = 'IVA'
}) {
  const { canCheckout } = useRolePermissions()

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-10 transition-all duration-300">
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg text-white shadow-lg shadow-primary/30">
            <ShoppingCart size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Carrito</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {isEmpty ? (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <ShoppingCart size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium tracking-tight">El carrito está vacío</p>
            <p className="text-xs text-slate-300 mt-2">Agrega productos del menú</p>
          </div>
        ) : (
          cart.items.map(item => (
            <div key={item.id} className="bg-slate-50/80 rounded-2xl p-4 border border-transparent hover:border-slate-200 transition-all group hover:bg-white hover:shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800 leading-tight pr-2">{item.name}</h3>
                <button 
                  onClick={() => onRemove(item.id)} 
                  className="text-slate-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => onUpdateQuantity(item.id, -1)} 
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 active:scale-95 transition-transform"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold w-6 text-center text-sm text-slate-700">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item.id, 1)} 
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 active:scale-95 transition-transform"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="font-black text-primary">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-slate-50/80 border-t border-slate-100 space-y-4 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="flex justify-between text-slate-500 font-medium text-sm">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 font-medium text-sm">
            <span>{taxName} ({(totals.taxRate * 100).toFixed(0)}%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-slate-900 pt-3 border-t border-slate-200 mt-2">
            <span>Total</span>
            <span className="text-primary">${totals.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          <button
            onClick={onPrintPreCheck}
            disabled={isEmpty || printingLoading}
            className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
            title="Imprimir Pre-cuenta"
          >
            <Printer size={20} />
          </button>
          
          <button
            onClick={onCheckout}
            disabled={isEmpty || !selectedTable || loading || printingLoading}
            className="col-span-4 bg-primary text-white py-4 rounded-2xl hover:bg-primary/90 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
            ) : (
              canCheckout ? (
                <>
                  <DollarSign />
                  Cobrar Orden
                </>
              ) : (
                <>
                  <Printer size={20} />
                  Enviar Comanda
                </>
              )
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
