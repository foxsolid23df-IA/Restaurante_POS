import { ChevronRight, TrendingDown } from 'lucide-react'

export default function CriticalStockAlerts({ items, onReorder }) {
  if (items.length === 0) return null

  return (
    <section className="mb-5 bg-white border border-rose-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-800">
        <TrendingDown size={18} />
        <h2 className="font-black">Stock crítico</h2>
        <span className="text-xs font-black bg-white border border-rose-200 rounded-full px-2 py-0.5">{items.length}</span>
      </div>

      <div className="divide-y divide-rose-100">
        {items.slice(0, 6).map((item) => {
          const minStock = Number(item.min_stock || 0)
          const currentStock = Number(item.current_stock || 0)
          const percentage = minStock > 0 ? Math.min(100, (currentStock / minStock) * 100) : 0

          return (
            <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-center">
              <div>
                <p className="font-black text-slate-950">{item.name}</p>
                <p className="text-sm text-slate-500">Disponible: {currentStock.toFixed(2)} {item.unit} · Mínimo: {minStock.toFixed(2)} {item.unit}</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600" style={{ width: `${percentage}%` }} />
              </div>
              <button
                onClick={() => onReorder(item)}
                className="h-9 px-3 bg-slate-950 text-white rounded-md font-black text-xs uppercase tracking-wide inline-flex items-center justify-center gap-1"
              >
                Reabastecer
                <ChevronRight size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
