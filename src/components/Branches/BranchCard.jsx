import { AlertTriangle, ArrowRightLeft, Check, Edit3, Eye, MapPin, Package, Power, Settings, Table2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
})

export default function BranchCard({
  branch,
  isCurrent,
  onSelect,
  onEdit,
  onView,
  onDeactivate,
  onReactivate
}) {
  const isActive = branch.isActive

  return (
    <article className={`rounded-xl border bg-white p-5 transition ${isCurrent ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-black text-slate-900">{branch.name}</h3>
            {branch.isMainOffice && <Badge>Matriz</Badge>}
            <Badge tone={isActive ? 'success' : 'muted'}>{isActive ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <MapPin size={15} />
            <span className="truncate">{branch.address || 'Ubicacion pendiente'}</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
          {branch.code || 'SIN CODIGO'}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Ventas hoy" value={currency.format(Number(branch.salesToday || 0))} />
        <Metric label="Ordenes" value={branch.openOrders || 0} />
        <Metric label="Mesas" value={`${branch.occupiedTables || 0}/${branch.totalTables || 0}`} />
        <Metric label="Staff" value={branch.activeStaff || 0} />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Signal icon={AlertTriangle} label="Stock" value={branch.criticalStock || 0} danger={Number(branch.criticalStock || 0) > 0} />
        <Signal icon={Package} label="Compras" value={branch.pendingPurchases || 0} />
        <Signal icon={ArrowRightLeft} label="Traspasos" value={branch.openTransfers || 0} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onSelect(branch)}
          disabled={isCurrent || !isActive}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition ${
            isCurrent
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500'
          }`}
        >
          <Check size={14} />
          {isCurrent ? 'Actual' : 'Seleccionar'}
        </button>
        <ActionButton icon={Eye} label="Detalle" onClick={() => onView(branch)} />
        <ActionButton icon={Edit3} label="Editar" onClick={() => onEdit(branch)} />
        <LinkButton icon={Table2} label="Salon" to="/admin/salon" />
        <LinkButton icon={Package} label="Inventario" to="/admin/inventory" />
        <LinkButton icon={Users} label="Personal" to="/admin/staff" />
        {isActive ? (
          <ActionButton icon={Power} label="Desactivar" onClick={() => onDeactivate(branch)} danger />
        ) : (
          <ActionButton icon={Settings} label="Reactivar" onClick={() => onReactivate(branch)} />
        )}
      </div>
    </article>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

function Signal({ icon: Icon, label, value, danger = false }) {
  return (
    <div className={`rounded-lg border p-3 ${danger ? 'border-red-100 bg-red-50 text-red-700' : 'border-slate-100 bg-white text-slate-700'}`}>
      <div className="mb-1 flex items-center gap-2">
        <Icon size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black">{value}</p>
    </div>
  )
}

function Badge({ children, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    muted: 'bg-slate-100 text-slate-500'
  }[tone]

  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${toneClass}`}>{children}</span>
}

function ActionButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${
        danger
          ? 'border-red-100 text-red-700 hover:bg-red-50'
          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function LinkButton({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
    >
      <Icon size={14} />
      {label}
    </Link>
  )
}
