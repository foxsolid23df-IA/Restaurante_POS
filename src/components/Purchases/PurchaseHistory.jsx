import { CheckCircle2, FileText, History, PackageX, XCircle } from 'lucide-react'

const statusLabel = {
  draft: 'Borrador',
  ordered: 'Pedido',
  partial: 'Parcial',
  received: 'Recibida',
  cancelled: 'Cancelada',
  pending: 'Pendiente'
}

const statusClass = {
  draft: 'bg-slate-100 text-slate-600',
  ordered: 'bg-blue-50 text-blue-700',
  partial: 'bg-amber-50 text-amber-700',
  received: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
  pending: 'bg-blue-50 text-blue-700'
}

export default function PurchaseHistory({
  history,
  onViewDetails,
  onReceive,
  onCancel,
  title = 'Bitácora de almacén',
  emptyLabel = 'Historial vacío'
}) {
  return (
    <section className="bg-white rounded-xl p-5 border border-slate-200">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
          <History size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          <p className="text-sm text-slate-500">Compras, recepción y auditoría de almacén.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] text-slate-400 uppercase tracking-wide">
            <tr>
              <th className="text-left py-3">Fecha / folio</th>
              <th className="text-left py-3">Proveedor</th>
              <th className="text-left py-3">Responsable</th>
              <th className="text-right py-3">Importe</th>
              <th className="text-center py-3">Estado</th>
              <th className="text-right py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {history.map((purchase) => {
              const canReceive = ['draft', 'ordered', 'partial', 'pending'].includes(purchase.status)
              const canCancel = ['draft', 'ordered', 'pending'].includes(purchase.status)

              return (
                <tr key={purchase.id} className="border-t border-slate-100">
                  <td className="py-4">
                    <p className="font-black text-slate-950">{new Date(purchase.purchase_date).toLocaleDateString('es-MX')}</p>
                    <p className="text-xs text-slate-500">{purchase.invoice_number || 'S/F'}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-black text-slate-800">{purchase.suppliers?.name || 'Sin proveedor'}</p>
                    <p className="text-xs text-slate-500">{purchase.suppliers?.category || 'Sin categoría'}</p>
                  </td>
                  <td className="py-4 text-slate-600">{purchase.profiles?.full_name || 'Sistema'}</td>
                  <td className="py-4 text-right font-black text-slate-950">
                    ${Number(purchase.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${statusClass[purchase.status] || statusClass.pending}`}>
                      {statusLabel[purchase.status] || purchase.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onViewDetails(purchase)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100" title="Detalles">
                        <FileText size={16} />
                      </button>
                      {canReceive && onReceive && (
                        <button onClick={() => onReceive(purchase)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Recibir completo">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {canCancel && onCancel && (
                        <button onClick={() => onCancel(purchase)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" title="Cancelar">
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {history.length === 0 && (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-400">
                  <PackageX className="mx-auto mb-3" size={40} />
                  <p className="font-black uppercase tracking-wide">{emptyLabel}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
