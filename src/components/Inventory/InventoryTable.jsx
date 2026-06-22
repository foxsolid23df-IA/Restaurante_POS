import { Edit2, History, Info, Package, RotateCcw, Trash2 } from 'lucide-react'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function StatusBadge({ status }) {
  const config = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  const labels = {
    critical: 'Crítico',
    warning: 'Preventivo',
    healthy: 'Saludable'
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${config[status] || config.healthy}`}>
      {labels[status] || 'Saludable'}
    </span>
  )
}

function ActionButton({ title, onClick, children, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors ${danger ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  )
}

export default function InventoryTable({ items, onEdit, onDelete, onAdjust, onHistory, onReactivate }) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">Inventario maestro</h3>
          <p className="text-sm text-slate-500">Existencias, costo y acciones operativas.</p>
        </div>
        <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          {items.length} registros
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">Insumo</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 text-right">Stock</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 text-right">Mínimo</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 text-right">Costo</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 text-right">Valor</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">Estado</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className={`hover:bg-slate-50 ${item.is_active === false ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 font-black">
                      {item.name?.charAt(0)?.toUpperCase() || 'I'}
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.unit} {item.is_active === false ? '· Inactivo' : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-black text-slate-950">{Number(item.current_stock || 0).toFixed(2)} {item.unit}</td>
                <td className="px-4 py-3 text-right text-slate-600">{Number(item.min_stock || 0).toFixed(2)} {item.unit}</td>
                <td className="px-4 py-3 text-right">
                  <span className={item.missingCost ? 'text-amber-700 font-black' : 'text-slate-700 font-semibold'}>
                    {money.format(Number(item.cost_per_unit || 0))}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{money.format(Number(item.totalValue || 0))}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={item.stockStatus} />
                    {item.missingCost && <span className="text-[11px] font-bold text-amber-700">Costo pendiente</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {item.is_active === false ? (
                      <ActionButton title="Reactivar" onClick={() => onReactivate(item)}>
                        <RotateCcw size={16} />
                      </ActionButton>
                    ) : (
                      <>
                        <ActionButton title="Ajustar stock" onClick={() => onAdjust(item)}>
                          <Package size={16} />
                        </ActionButton>
                        <ActionButton title="Kardex" onClick={() => onHistory(item)}>
                          <History size={16} />
                        </ActionButton>
                        <ActionButton title="Editar" onClick={() => onEdit(item)}>
                          <Edit2 size={16} />
                        </ActionButton>
                        <ActionButton title="Retirar" onClick={() => onDelete(item)} danger>
                          <Trash2 size={16} />
                        </ActionButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="p-12 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
            <Info size={30} strokeWidth={1.5} />
          </div>
          <h4 className="text-xl font-black text-slate-950 mb-1">Sin registros</h4>
          <p className="text-slate-500 text-sm">Agrega insumos o ajusta los filtros de búsqueda.</p>
        </div>
      )}
    </section>
  )
}
