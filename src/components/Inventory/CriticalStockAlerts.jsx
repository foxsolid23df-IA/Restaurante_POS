import { TrendingDown, ChevronRight } from 'lucide-react'

export default function CriticalStockAlerts({ items, onReorder }) {
  if (items.length === 0) return null

  return (
    <section className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
          <TrendingDown size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Alertas de Abastecimiento</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(item => {
          const percentage = Math.min(100, (item.current_stock / item.min_stock) * 100)
          return (
            <div 
              key={item.id} 
              className="bg-white p-8 rounded-[3rem] border-2 border-rose-50 shadow-2xl shadow-rose-100/30 flex flex-col justify-between group hover:border-rose-200 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-rose-600 transition-colors">{item.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                    Nivel Crítico
                  </span>
                </div>
                
                <div className="space-y-4 mb-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disponible</p>
                      <p className="text-2xl font-black text-rose-600 tracking-tight">
                        {item.current_stock} <span className="text-sm uppercase opacity-60 ml-1">{item.unit}</span>
                      </p>
                    </div>
                    <p className="text-xs font-black text-slate-400">Min: {item.min_stock}</p>
                  </div>
                  
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        percentage < 25 ? 'bg-rose-600' : percentage < 50 ? 'bg-amber-500' : 'bg-rose-400'
                      }`}
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => onReorder(item)}
                className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
              >
                Reabastecer Ahora
                <ChevronRight size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
