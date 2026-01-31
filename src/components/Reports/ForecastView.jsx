import { DollarSign, ShoppingCart, AlertTriangle, FileText, Package, CheckCircle2, Info } from 'lucide-react'
import { MetricCard } from './MetricCards'

export default function ForecastView({ data, formatCurrency, onGeneratePDF, onOpenReceiptModal }) {
  const items = data.forecast?.items || []

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <MetricCard 
          title="Inversión Proyectada" 
          value={formatCurrency(data.forecast?.totalEstimatedCost || 0)} 
          change={null}
          icon={<DollarSign size={24} />}
          colorClass="text-primary"
        />
        <MetricCard 
          title="Artículos en Reorden" 
          value={items.filter(i => i.toBuy > 0).length || 0} 
          change={null}
          icon={<ShoppingCart size={24} />}
          colorClass="text-blue-500"
        />
        <MetricCard 
          title="Riesgo de Desabasto" 
          value={data.forecast?.urgentCount || 0} 
          change={null}
          icon={<AlertTriangle size={24} />}
          colorClass="text-rose-500"
        />
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-3xl overflow-hidden relative">
        <div className="p-12 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
             <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3 italic">Ciclo de Reabastecimiento</h3>
                <p className="text-slate-400 font-medium text-lg flex items-center gap-2">
                   <Info size={18} className="text-primary" />
                   Cálculo predictivo basado en consumo histórico de 30 días
                </p>
             </div>
             <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={onGeneratePDF}
                  className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  <FileText size={20} />
                  Generar PDF
                </button>
                <button 
                  onClick={onOpenReceiptModal}
                  className="flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-200 active:scale-95"
                >
                  <Package size={20} />
                  Ingresar Stock
                </button>
                <div className="bg-white text-primary border-4 border-emerald-50 px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-sm italic">
                   Próxima Semana
                </div>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-10 py-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Materia Prima / Insumo</th>
                <th className="px-10 py-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Existencia Real</th>
                <th className="px-10 py-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Demanda Semanal</th>
                <th className="px-10 py-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Propuesta de Compra</th>
                <th className="px-10 py-10 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Costo Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => {
                const isUrgent = item.currentStock < item.minStock
                const needsBuy = item.toBuy > 0
                
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-all group ${needsBuy ? 'bg-amber-50/10' : ''}`}>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all border ${
                           needsBuy ? 'bg-amber-50 text-amber-500 border-amber-100 rotate-6' : 'bg-slate-100 text-slate-400 border-slate-200'
                         }`}>
                            {item.name[0].toUpperCase()}
                         </div>
                         <div>
                            <div className="font-black text-slate-900 text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className={`text-2xl font-black tracking-tighter ${isUrgent ? 'text-rose-500' : 'text-slate-900'}`}>
                         {item.currentStock.toFixed(1)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">S. Mín: {item.minStock}</div>
                    </td>
                    <td className="px-10 py-8 text-center font-black text-slate-500 text-lg tracking-tighter">
                      {item.neededNextWeek.toFixed(1)}
                    </td>
                    <td className="px-10 py-8 text-center">
                      {needsBuy ? (
                         <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-400 text-amber-950 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-200 border border-amber-300">
                            <ShoppingCart size={14} />
                            Pedir {item.toBuy.toFixed(1)} {item.unit}
                         </div>
                      ) : (
                         <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-50 text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-slate-100">
                            <CheckCircle2 size={14} className="text-primary" />
                            Balanceado
                         </div>
                      )}
                    </td>
                    <td className="px-10 py-8 text-right font-black text-slate-900 text-xl tracking-tighter">
                      {formatCurrency(item.estimatedCost)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {items.length === 0 && (
           <div className="text-center py-32 px-10">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner opacity-40">
                 <Target size={48} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Sin Datos Predictivos</h3>
              <p className="text-slate-400 font-medium">Inicia ventas constantes para activar el motor de proyecciones.</p>
           </div>
        )}
      </div>
    </div>
  )
}
