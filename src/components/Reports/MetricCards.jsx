import { TrendingUp, TrendingDown, Info } from 'lucide-react'

export function MetricCard({ title, value, change, icon, colorClass = "text-primary" }) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/30 relative overflow-hidden group hover:scale-[1.03] transition-all duration-500">
       <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-10 transition-all text-slate-900 scale-[2] transform group-hover:rotate-12 pointer-events-none">
          {icon}
       </div>
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5 px-1 py-1 pr-6 bg-slate-50 rounded-2xl border border-slate-100/50">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${colorClass.includes('text-primary') ? 'bg-primary text-white' : 'bg-slate-900 text-white'}`}>
              {icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          </div>
          <button className="text-slate-200 hover:text-primary transition-colors">
             <Info size={16} />
          </button>
       </div>
       <div className="flex items-baseline gap-4 relative z-10">
          <h4 className="text-5xl font-black text-slate-900 tracking-tighter">{value}</h4>
          {change !== undefined && change !== null && (
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
               {isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
               <span>{Math.abs(change).toFixed(1)}%</span>
             </div>
          )}
       </div>
    </div>
  )
}

export function FinancialCard({ label, value, icon, color, active = false }) {
  return (
    <div className={`p-10 rounded-[3.5rem] border shadow-2xl group transition-all duration-700 relative overflow-hidden ${
      active 
        ? 'bg-slate-900 border-slate-900 shadow-slate-300' 
        : 'bg-white border-slate-100 hover:bg-slate-50'
    }`}>
       {active && (
         <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
       )}
       <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center mb-10 transition-all border shadow-inner transform group-hover:rotate-6 ${
         active 
           ? 'bg-primary border-primary text-white shadow-emerald-500/20' 
           : `bg-slate-50 border-slate-100 ${color}`
       }`}>
          {icon}
       </div>
       <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${
         active ? 'text-slate-400' : 'text-slate-400'
       }`}>{label}</p>
       <p className={`text-4xl font-black tracking-tighter ${
         active ? 'text-white' : 'text-slate-900'
       }`}>{value}</p>
       
       {!active && (
         <div className="mt-8 flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
            <span className="text-[10px] font-black uppercase tracking-widest">Ver Detalles</span>
            <TrendingUp size={12} />
         </div>
       )}
    </div>
  )
}
