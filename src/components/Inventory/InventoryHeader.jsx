import { AlertTriangle, DollarSign, Package, Plus, TrendingDown, TrendingUp } from 'lucide-react'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function Kpi({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700'
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3 min-w-0">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg font-black text-slate-950 truncate">{value}</p>
      </div>
    </div>
  )
}

export default function InventoryHeader({ totalItems, criticalCount, dashboard = {}, onAddItem }) {
  return (
    <header className="mb-5 space-y-4">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Inventarios</h1>
          <p className="text-slate-500 mt-1 font-medium">Stock, costos, alertas y Kardex por sucursal.</p>
        </div>

        <button
          onClick={onAddItem}
          className="h-11 inline-flex items-center justify-center gap-2 bg-slate-950 text-white px-5 rounded-md hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-wide"
        >
          <Plus size={18} strokeWidth={3} />
          Nuevo insumo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <Kpi icon={Package} label="Insumos" value={dashboard.totalItems ?? totalItems} />
        <Kpi icon={AlertTriangle} label="Críticos" value={dashboard.criticalCount ?? criticalCount} tone={criticalCount > 0 ? 'rose' : 'emerald'} />
        <Kpi icon={DollarSign} label="Valor stock" value={currency.format(Number(dashboard.inventoryValue || 0))} tone="emerald" />
        <Kpi icon={AlertTriangle} label="Sin costo" value={dashboard.missingCostCount || 0} tone={(dashboard.missingCostCount || 0) > 0 ? 'amber' : 'slate'} />
        <Kpi icon={TrendingUp} label="Entradas hoy" value={Number(dashboard.entriesToday || 0).toFixed(2)} tone="blue" />
        <Kpi icon={TrendingDown} label="Salidas hoy" value={Number(dashboard.exitsToday || 0).toFixed(2)} tone="rose" />
      </div>
    </header>
  )
}
