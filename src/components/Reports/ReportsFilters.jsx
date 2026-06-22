import { Calendar, Filter, Zap } from 'lucide-react'

export default function ReportsFilters({ filters, setFilters }) {
  const updatePeriod = (period) => {
    const end = new Date()
    const start = new Date()

    if (period === 'today') {
      setFilters({
        ...filters,
        period,
        startDate: toInputDate(end),
        endDate: toInputDate(end)
      })
      return
    }

    if (period === 'week') start.setDate(end.getDate() - 7)
    if (period === 'month') start.setMonth(end.getMonth() - 1)
    if (period === 'year') start.setFullYear(end.getFullYear() - 1)

    setFilters({
      ...filters,
      period,
      startDate: toInputDate(start),
      endDate: toInputDate(end)
    })
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <FilterSelect
          label="Periodo"
          value={filters.period}
          icon={<Zap size={14} />}
          onChange={updatePeriod}
          options={[
            { value: 'today', label: 'Hoy' },
            { value: 'week', label: 'Ultimos 7 dias' },
            { value: 'month', label: 'Ultimos 30 dias' },
            { value: 'year', label: 'Ultimo ano' }
          ]}
        />
        <FilterInput
          label="Desde"
          type="date"
          icon={<Calendar size={14} />}
          value={filters.startDate}
          onChange={(value) => setFilters({ ...filters, startDate: value, period: 'custom' })}
        />
        <FilterInput
          label="Hasta"
          type="date"
          icon={<Calendar size={14} />}
          value={filters.endDate}
          onChange={(value) => setFilters({ ...filters, endDate: value, period: 'custom' })}
        />
        <FilterSelect
          label="Comparativa"
          value={filters.comparisonPeriod}
          icon={<Filter size={14} />}
          onChange={(value) => setFilters({ ...filters, comparisonPeriod: value })}
          options={[
            { value: 'previous', label: 'Periodo anterior' },
            { value: 'none', label: 'Sin comparativa' }
          ]}
        />
      </div>
    </section>
  )
}

function FilterSelect({ label, value, onChange, options, icon }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function FilterInput({ label, type, value, onChange, icon }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm"
      />
    </label>
  )
}

const toInputDate = (date) => date.toISOString().split('T')[0]
