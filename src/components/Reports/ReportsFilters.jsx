import { Filter, Calendar, Zap } from 'lucide-react'

export default function ReportsFilters({ filters, setFilters }) {
  return (
    <section className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50 mb-12 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 pointer-events-none transform group-hover:rotate-12">
         <Filter size={180} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
        <FilterSelect 
          label="Segmento Temporal" 
          value={filters.period} 
          icon={<Zap size={14}/>}
          onChange={(v) => setFilters({...filters, period: v})}
          options={[
            { value: 'today', label: 'Jornada Actual' },
            { value: 'week', label: 'Ciclo Semanal' },
            { value: 'month', label: 'Periodo Mensual' },
            { value: 'year', label: 'Ejercicio Anual' }
          ]}
        />
        <FilterInput 
          label="Desde (Apertura)" 
          type="date" 
          icon={<Calendar size={14}/>}
          value={filters.startDate} 
          onChange={(v) => setFilters({...filters, startDate: v})} 
        />
        <FilterInput 
          label="Hasta (Cierre)" 
          type="date" 
          icon={<Calendar size={14}/>}
          value={filters.endDate} 
          onChange={(v) => setFilters({...filters, endDate: v})} 
        />
        <FilterSelect 
          label="Referencia Comparativa" 
          value={filters.comparisonPeriod} 
          icon={<Filter size={14}/>}
          onChange={(v) => setFilters({...filters, comparisonPeriod: v})}
          options={[
            { value: 'previous', label: 'Ciclo Anterior' },
            { value: 'none', label: 'Sin Comparativa' }
          ]}
        />
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options, icon }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="relative">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] pl-8 pr-12 py-5 font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer text-sm"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
           <Filter size={16} />
        </div>
      </div>
    </div>
  )
}

function FilterInput({ label, type, value, onChange, icon }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] px-8 py-5 font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-sm"
      />
    </div>
  )
}
