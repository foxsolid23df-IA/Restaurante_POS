import { Info, TrendingDown, TrendingUp } from 'lucide-react'

export function MetricCard({ title, value, change, icon, colorClass = 'text-primary' }) {
  const hasChange = change !== undefined && change !== null
  const isPositive = Number(change || 0) >= 0

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm min-h-[150px]">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-900 text-white ${colorClass}`}>
            {icon}
          </div>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-snug">{title}</p>
        </div>
        <Info size={15} className="text-slate-300 shrink-0" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <h4 className="text-[clamp(1.65rem,2.5vw,2.4rem)] font-black text-slate-900 tracking-tight leading-none break-words">
          {value}
        </h4>
        {hasChange && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(Number(change || 0)).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  )
}

export function FinancialCard({ label, value, icon, color, active = false }) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm min-h-[150px] ${
      active ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
    }`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${
        active ? 'bg-primary text-white' : `bg-slate-50 ${color}`
      }`}>
        {icon}
      </div>
      <p className={`text-[11px] font-black uppercase tracking-widest mb-2 ${active ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-[clamp(1.55rem,2.3vw,2.2rem)] font-black tracking-tight leading-none break-words ${
        active ? 'text-white' : 'text-slate-900'
      }`}>
        {value}
      </p>
    </div>
  )
}
