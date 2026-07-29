import { X, Receipt, Printer } from 'lucide-react'
import { clsx } from 'clsx'

export default function PreCheckModal({ isOpen, onClose, cart, totals, selectedTable, taxName = 'IVA', onPrint, orderType = 'dine_in', customerInfo = null }) {
  if (!isOpen || !cart) return null

  const isTakeaway = orderType === 'takeaway'
  const tableName = isTakeaway
    ? (customerInfo?.name ? `Para llevar: ${customerInfo.name}` : 'Para llevar')
    : (selectedTable?.name || selectedTable || 'Sin mesa')
  const date = new Date().toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short'
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-xl text-white">
              <Receipt size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-primary dark:text-white uppercase tracking-widest">Pre-cuenta</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
            <span>{isTakeaway ? 'Tipo' : 'Mesa'}</span>
            <span className="text-primary dark:text-white">{tableName}</span>
          </div>
          {isTakeaway && customerInfo?.phone && (
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
              <span>Teléfono</span>
              <span className="text-primary dark:text-white">{customerInfo.phone}</span>
            </div>
          )}
          {isTakeaway && customerInfo?.note && (
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
              <span>Nota</span>
              <span className="text-primary dark:text-white text-right max-w-[60%]">{customerInfo.note}</span>
            </div>
          )}

          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{item.quantity}x {item.name}</p>
                  {item.notes && <p className="text-[10px] text-slate-400 mt-0.5">{item.notes}</p>}
                </div>
                <p className="font-black text-slate-700 dark:text-slate-200 font-display">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-200 font-display">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
              <span>{taxName} ({(totals.taxRate * 100).toFixed(0)}%)</span>
              <span className="text-slate-700 dark:text-slate-200 font-display">${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-primary dark:text-white pt-2">
              <span>Total</span>
              <span className="text-secondary">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex-1 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} strokeWidth={2.5} />
              Imprimir
            </button>
          )}
          <button
            onClick={onClose}
            className={clsx(
              "py-3.5 bg-slate-900 dark:bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
              onPrint ? "flex-1" : "w-full"
            )}
          >
            Cerrar vista
          </button>
        </div>
      </div>
    </div>
  )
}
