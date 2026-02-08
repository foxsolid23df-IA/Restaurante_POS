import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Printer,
  DollarSign,
} from "lucide-react";
import { useRolePermissions } from "@/hooks/useRolePermissions";

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
  taxName = "IVA",
}) {
  const { canCheckout } = useRolePermissions();

  return (
    <div className="w-[420px] bg-white border-l border-slate-100 flex flex-col shadow-2xl z-10 transition-all duration-300">
      <div className="p-8 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary rounded-xl text-white shadow-lg shadow-blue-500/20">
              <ShoppingCart size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary tracking-tight font-display uppercase leading-tight">Orden Actual</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                {selectedTable ? `Mesa: ${selectedTable.name || selectedTable}` : 'Sin mesa asignada'}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{totals.itemsCount} Items</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-slate-50/30">
        {isEmpty ? (
          <div className="text-center py-24 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-8 rounded-[3rem] w-32 h-32 mx-auto mb-6 flex items-center justify-center border border-slate-100 shadow-inner">
              <ShoppingCart size={40} className="text-slate-100" strokeWidth={2.5} />
            </div>
            <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">
              Carrito Vacío
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Agrega productos para continuar
            </p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div
              key={item.id}
              className="premium-card p-5 group hover:bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-primary leading-tight pr-4 text-sm font-sans">
                  {item.name}
                </h3>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-slate-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl active:scale-90"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-50/50 rounded-xl p-1 border border-slate-100">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-500 active:scale-90 transition-all shadow-sm"
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="font-black w-8 text-center text-xs text-primary">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-500 active:scale-90 transition-all shadow-sm"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-black mb-0.5 uppercase tracking-tighter">${parseFloat(item.price).toFixed(2)} c/u</p>
                  <p className="font-black text-secondary text-lg tracking-tight font-display">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-100 space-y-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="space-y-3">
          <div className="flex justify-between text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="text-primary font-display font-black text-sm">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <span>
              {taxName} ({(totals.taxRate * 100).toFixed(0)}%)
            </span>
            <span className="text-primary font-display font-black text-sm">${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-4xl font-black text-primary pt-5 border-t border-slate-50 mt-4 leading-none font-display uppercase tracking-tight">
            <span>Total</span>
            <div className="flex flex-col items-end">
              <span className="text-secondary">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPrintPreCheck}
            disabled={isEmpty || printingLoading}
            className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl hover:bg-white hover:border-slate-200 hover:text-primary transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
            title="Imprimir Pre-cuenta"
          >
            <Printer size={22} strokeWidth={2.5} />
          </button>

          <button
            onClick={onCheckout}
            disabled={isEmpty || !selectedTable || loading || printingLoading}
            className="flex-1 bg-secondary text-white rounded-2xl hover:bg-blue-700 transition-all font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white" />
            ) : canCheckout ? (
              <>
                <DollarSign size={20} strokeWidth={3} />
                <span>Cobrar Cuenta</span>
              </>
            ) : (
              <>
                <Printer size={20} strokeWidth={3} />
                <span>Mandar a Comanda</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

