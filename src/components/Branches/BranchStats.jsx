import { AlertTriangle, ArrowRightLeft, Building2, DollarSign, ShoppingCart, Users } from 'lucide-react'

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
})

export default function BranchStats({ branches = [] }) {
  const activeBranches = branches.filter((branch) => branch.isActive)
  const totals = branches.reduce((acc, branch) => ({
    salesToday: acc.salesToday + Number(branch.salesToday || 0),
    openOrders: acc.openOrders + Number(branch.openOrders || 0),
    activeStaff: acc.activeStaff + Number(branch.activeStaff || 0),
    criticalStock: acc.criticalStock + Number(branch.criticalStock || 0),
    pendingPurchases: acc.pendingPurchases + Number(branch.pendingPurchases || 0),
    openTransfers: acc.openTransfers + Number(branch.openTransfers || 0)
  }), {
    salesToday: 0,
    openOrders: 0,
    activeStaff: 0,
    criticalStock: 0,
    pendingPurchases: 0,
    openTransfers: 0
  })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <StatCard icon={Building2} label="Sucursales" value={`${activeBranches.length}/${branches.length}`} />
      <StatCard icon={DollarSign} label="Ventas hoy" value={currency.format(totals.salesToday)} />
      <StatCard icon={ShoppingCart} label="Ordenes abiertas" value={totals.openOrders} />
      <StatCard icon={Users} label="Personal activo" value={totals.activeStaff} />
      <StatCard icon={AlertTriangle} label="Stock critico" value={totals.criticalStock} tone={totals.criticalStock > 0 ? 'danger' : 'neutral'} />
      <StatCard icon={ArrowRightLeft} label="Pendientes" value={totals.pendingPurchases + totals.openTransfers} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const toneClass = tone === 'danger'
    ? 'bg-red-50 text-red-700 border-red-100'
    : 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className={`rounded-lg border p-2 ${toneClass}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="truncate text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}
