import { Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BarChart3,
  Box,
  ChefHat,
  CreditCard,
  DollarSign,
  FileWarning,
  Package,
  Receipt,
  ShoppingCart,
  Target,
  Utensils
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useDashboardStats } from '@/features/admin/hooks/useDashboardStats'
import { useBranchStore } from '@/store/branchStore'

const formatCurrency = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatNumber = (value) => new Intl.NumberFormat('es-MX').format(Number(value || 0))

const cardTone = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200'
}

const alertTone = {
  critical: 'border-rose-200 bg-rose-50 text-rose-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900'
}

function DashboardContent() {
  const navigate = useNavigate()
  const { currentBranch } = useBranchStore()
  const { stats, isRefetching } = useDashboardStats(currentBranch?.id)

  const summaryCards = [
    {
      title: 'Ventas de hoy',
      value: formatCurrency(stats.salesToday),
      detail: stats.completedOrdersToday > 0 ? `${stats.completedOrdersToday} órdenes cerradas` : 'Sin ventas registradas hoy',
      icon: DollarSign,
      tone: 'blue'
    },
    {
      title: 'Ticket promedio',
      value: formatCurrency(stats.averageTicket),
      detail: stats.completedOrdersToday > 0 ? 'Basado en órdenes completadas' : 'Sin órdenes completadas',
      icon: Target,
      tone: 'emerald'
    },
    {
      title: 'Órdenes abiertas',
      value: formatNumber(stats.openOrders),
      detail: stats.openOrders > 0 ? 'Requieren seguimiento operativo' : 'Operación sin pendientes abiertos',
      icon: Receipt,
      tone: stats.openOrders > 0 ? 'amber' : 'slate'
    },
    {
      title: 'Stock crítico',
      value: formatNumber(stats.criticalStock.length),
      detail: stats.criticalStock.length > 0 ? 'Insumos en mínimo o por debajo' : 'Sin alertas críticas de stock',
      icon: AlertTriangle,
      tone: stats.criticalStock.length > 0 ? 'rose' : 'slate'
    }
  ]

  const paymentRows = [
    { label: 'Efectivo', value: stats.paymentBreakdown.cash, icon: DollarSign },
    { label: 'Tarjeta', value: stats.paymentBreakdown.card, icon: CreditCard },
    { label: 'Transferencia', value: stats.paymentBreakdown.transfer, icon: BarChart3 },
    { label: 'Otros', value: stats.paymentBreakdown.digital_wallet + stats.paymentBreakdown.other, icon: Box }
  ]

  const moduleLinks = [
    { label: 'Reportes', path: '/admin/reports', icon: BarChart3, helper: 'Ventas, productos y forecast' },
    { label: 'Catálogo', path: '/admin/catalog', icon: Utensils, helper: 'Menú, precios y recetas' },
    { label: 'Inventario', path: '/admin/inventory', icon: Package, helper: 'Stock, ajustes e historial' },
    { label: 'Compras', path: '/admin/purchases', icon: ShoppingCart, helper: 'Proveedores y recepción' },
    { label: 'Salón', path: '/admin/salon', icon: ChefHat, helper: 'Mesas, áreas y capacidad' },
    { label: 'Configuración', path: '/admin/settings', icon: Archive, helper: 'Ticket, fiscal e impresoras' }
  ]

  return (
    <div className="p-6 lg:p-8 max-w-[1700px] mx-auto bg-[#f8fafc] min-h-screen space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panel administrador</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operación del restaurante</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {currentBranch?.name ? `Vista de ${currentBranch.name}` : 'Vista consolidada de operación'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/pos/cash-closing')}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-700 hover:border-blue-200 hover:text-blue-700 transition-colors"
          >
            <DollarSign size={16} /> Corte de caja
          </button>
          <button
            onClick={() => navigate('/admin/purchases')}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart size={16} /> Compra sugerida
          </button>
        </div>
      </header>

      {isRefetching && (
        <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Actualizando métricas...</div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.title}</p>
                  <p className="text-3xl font-black text-slate-950 mt-2 tracking-tight">{card.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${cardTone[card.tone]}`}>
                  <Icon size={21} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-4">{card.detail}</p>
            </article>
          )
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">Ventas últimos 7 días</h2>
              <p className="text-xs font-semibold text-slate-500">Datos tomados de pagos registrados</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">7 días</span>
          </div>
          <div className="h-[300px]">
            {stats.weeklySales.every((day) => day.sales === 0) ? (
              <div className="h-full flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center px-6">
                <BarChart3 className="text-slate-300 mb-3" size={42} />
                <p className="font-black text-slate-700">Sin pagos registrados esta semana</p>
                <p className="text-sm text-slate-500 mt-1">Cuando se capturen pagos, la tendencia aparecerá aquí.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklySales}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Ventas']} labelFormatter={(label) => `Día ${label}`} />
                  <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Cobros de hoy</h2>
          <p className="text-xs font-semibold text-slate-500 mb-5">Distribución por método de pago</p>
          <div className="space-y-3">
            {paymentRows.map((row) => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                      <Icon size={16} />
                    </div>
                    <span className="text-sm font-black text-slate-700">{row.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-950">{formatCurrency(row.value)}</span>
                </div>
              )
            })}
          </div>
          {stats.salesToday > 0 && stats.paymentBreakdown.cash + stats.paymentBreakdown.card + stats.paymentBreakdown.transfer + stats.paymentBreakdown.digital_wallet + stats.paymentBreakdown.other === 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-800">
              Ventas calculadas desde órdenes completadas. Captura pagos para ver desglose real.
            </div>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900">Alertas accionables</h2>
              <p className="text-xs font-semibold text-slate-500">Prioridad operativa para el turno</p>
            </div>
            <FileWarning size={20} className="text-slate-400" />
          </div>
          {stats.alerts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="font-black text-slate-700">Sin alertas críticas por ahora</p>
              <p className="text-sm text-slate-500 mt-1">La operación se ve estable para la sucursal seleccionada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.alerts.map((alert) => (
                <button
                  key={`${alert.title}-${alert.path}`}
                  onClick={() => navigate(alert.path)}
                  className={`text-left rounded-xl border p-4 transition-colors hover:bg-white ${alertTone[alert.type] || alertTone.info}`}
                >
                  <p className="text-sm font-black">{alert.title}</p>
                  <p className="text-xs font-semibold opacity-80 mt-1 leading-relaxed">{alert.message}</p>
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mt-4">
                    {alert.actionLabel} <ArrowRight size={13} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Stock crítico</h2>
          <p className="text-xs font-semibold text-slate-500 mb-5">Primeros insumos a revisar</p>
          {stats.criticalStock.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6 text-center">
              <Package className="text-slate-300 mx-auto mb-3" size={36} />
              <p className="text-sm font-black text-slate-700">Inventario estable</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.criticalStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-rose-100 bg-rose-50">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-rose-950 truncate">{item.name}</p>
                    <p className="text-[11px] font-semibold text-rose-700">Mínimo: {item.min_stock} {item.unit}</p>
                  </div>
                  <span className="text-sm font-black text-rose-900 whitespace-nowrap">{item.current_stock} {item.unit}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">Accesos rápidos</h2>
            <p className="text-xs font-semibold text-slate-500">Flujos frecuentes del administrador</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {moduleLinks.map((module) => {
            const Icon = module.icon
            return (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">{module.label}</p>
                    <p className="text-xs font-semibold text-slate-500 truncate">{module.helper}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 shrink-0" />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/10 border-t-secondary" />
          <p className="font-black text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Sincronizando operación...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
