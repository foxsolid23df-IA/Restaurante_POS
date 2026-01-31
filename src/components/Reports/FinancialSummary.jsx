import { DollarSign, TrendingDown, TrendingUp, Target, ShieldCheck, Briefcase } from 'lucide-react'
import { FinancialCard } from './MetricCards'

export default function FinancialSummary({ data, formatCurrency }) {
  const progress = 78; // Simulado para el diseño
  
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <FinancialCard 
          label="Ingresos Liquidados" 
          value={formatCurrency(data.financials?.totalRevenue || 0)} 
          icon={<DollarSign size={24} />}
          color="text-emerald-500"
          active={true}
        />
        <FinancialCard 
          label="Estructura de Gastos" 
          value={formatCurrency(data.kpis?.estimatedCosts || 0)} 
          icon={<Briefcase size={24} />}
          color="text-rose-500"
        />
        <FinancialCard 
          label="Utilidad Operativa" 
          value={formatCurrency(data.kpis?.grossProfit || 0)} 
          icon={<TrendingUp size={24} />}
          color="text-emerald-500"
        />
      </div>

      <div className="bg-white rounded-[4rem] p-16 border border-slate-100 shadow-3xl text-center relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-10 transition-all pointer-events-none transform group-hover:scale-110">
             <Target size={250} />
         </div>
         
         <div className="max-w-2xl mx-auto relative z-10">
            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border-4 border-slate-800 transform rotate-6 group-hover:rotate-0 transition-all duration-700">
              <Target className="text-primary" size={48} />
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none">Umbral de Rentabilidad</h3>
            <p className="text-slate-400 font-medium text-lg mb-12 leading-relaxed max-w-lg mx-auto">
               Cálculo algorítmico del punto de equilibrio basado en costos fijos y variables del trimestre actual.
            </p>
            
            <div className="relative pt-1 space-y-6">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                   <ShieldCheck size={16} className="text-primary" />
                   Cobertura de Costos Fijos
                </span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                   {progress}%
                </span>
              </div>
              
              <div className="overflow-hidden h-6 mb-4 text-xs flex rounded-full bg-slate-100 border-4 border-slate-100 shadow-inner">
                <div style={{ width: `${progress}%` }} className="shadow-lg flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-1000 ease-out rounded-full relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 inline-block px-10">
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">
                    Diferencial Operativo: <span className="text-primary ml-2">{formatCurrency(Math.max(0, (data.financials?.totalRevenue || 0) * 0.22))}</span>
                 </p>
              </div>
            </div>
         </div>
      </div>
    </div>
  )
}
