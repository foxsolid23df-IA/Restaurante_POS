import { Calendar, CheckCircle2, DollarSign, Package, Truck, X, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePurchases } from '@/hooks/usePurchases'

export default function PurchaseDetailsModal({ purchase, onClose, onReceive, onCancel }) {
  const { getPurchaseDetails, loading } = usePurchases()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (purchase?.id) loadDetails()
  }, [purchase?.id])

  const loadDetails = async () => {
    const data = await getPurchaseDetails(purchase.id)
    setItems(data || [])
  }

  const canReceive = ['draft', 'ordered', 'partial', 'pending'].includes(purchase.status)
  const canCancel = ['draft', 'ordered', 'pending'].includes(purchase.status)

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
        <header className="p-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-950">Detalles de compra</h3>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                Folio: {purchase.invoice_number || 'S/N'}
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                <Calendar size={12} /> {new Date(purchase.purchase_date).toLocaleDateString('es-MX')}
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                Estado: {purchase.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600">
            <X size={22} />
          </button>
        </header>

        <main className="p-5 overflow-y-auto">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Proveedor</p>
              <p className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Truck size={18} /> {purchase.suppliers?.name || 'Sin proveedor'}
              </p>
              <p className="text-xs text-slate-500 mt-1">{purchase.suppliers?.category || 'Sin categoría'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">Importe</p>
              <p className="text-3xl font-black text-slate-950 flex items-center justify-end gap-1">
                <DollarSign size={18} /> {Number(purchase.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">IVA estimado incluido</p>
            </div>
          </section>

          <section>
            <h4 className="font-black text-slate-950 mb-3 flex items-center gap-2">
              <Package size={18} />
              Partidas
            </h4>
            <div className="space-y-2">
              {loading ? (
                <div className="py-12 text-center text-slate-400">Cargando detalles...</div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">Sin partidas encontradas</div>
              ) : (
                items.map((item) => {
                  const quantity = Number(item.quantity || 0)
                  const received = Number(item.received_quantity || 0)
                  return (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px] gap-3 items-center border border-slate-200 rounded-lg p-3">
                      <div>
                        <p className="font-black text-slate-950">{item.inventory_items?.name}</p>
                        <p className="text-xs text-slate-500">{item.inventory_items?.unit}</p>
                      </div>
                      <Metric label="Pedido" value={quantity.toFixed(2)} />
                      <Metric label="Recibido" value={received.toFixed(2)} />
                      <Metric label="Pendiente" value={Math.max(0, quantity - received).toFixed(2)} />
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </main>

        <footer className="p-5 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
          {canCancel && onCancel && (
            <button onClick={() => onCancel(purchase)} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-black uppercase">
              <XCircle size={16} />
              Cancelar
            </button>
          )}
          {canReceive && onReceive && (
            <button onClick={() => onReceive(purchase)} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white text-xs font-black uppercase">
              <CheckCircle2 size={16} />
              Recibir completo
            </button>
          )}
          <button onClick={onClose} className="px-4 py-3 rounded-lg bg-slate-900 text-white text-xs font-black uppercase">
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="font-black text-slate-950">{value}</p>
    </div>
  )
}
