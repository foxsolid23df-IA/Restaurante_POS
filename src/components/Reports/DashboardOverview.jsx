import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, CreditCard, DollarSign, FileText, ReceiptText, ShoppingCart, Target } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { MetricCard } from './MetricCards'
import { isElectron } from '@/lib/electronBridge'

const COLORS = ['#059669', '#2563eb', '#f59e0b']

export default function DashboardOverview({ data, formatCurrency }) {
  const summary = data.currentSummary || {}
  const hourlyData = data.hourlyData || []
  const hasSales = Number(summary.totalSales || 0) > 0
  const pieData = [
    { name: 'Efectivo', value: summary.cashSales || 0 },
    { name: 'Tarjeta', value: summary.cardSales || 0 },
    { name: 'Otros', value: summary.otherSales || 0 }
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Ventas liquidadas"
          value={formatCurrency(summary.totalSales || 0)}
          change={data.comparison?.variance?.sales}
          icon={<DollarSign size={22} />}
          colorClass="text-emerald-600"
        />
        <MetricCard
          title="Ordenes pagadas"
          value={summary.totalOrders || 0}
          change={data.comparison?.variance?.orders}
          icon={<ReceiptText size={22} />}
          colorClass="text-blue-600"
        />
        <MetricCard
          title="Ticket promedio"
          value={formatCurrency(summary.averageTicket || 0)}
          change={data.comparison?.variance?.avgTicket}
          icon={<Target size={22} />}
          colorClass="text-amber-600"
        />
        <MetricCard
          title="Margen bruto"
          value={`${Number(summary.grossMargin || 0).toFixed(1)}%`}
          change={null}
          icon={<CreditCard size={22} />}
          colorClass="text-slate-900"
        />
      </div>

      {!hasSales && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h3 className="text-lg font-black text-slate-900">Sin ventas liquidadas en el periodo</h3>
            <p className="text-sm text-slate-500 mt-1">Los reportes financieros se activan cuando existen pagos registrados en caja.</p>
          </div>
          {isElectron && (
            <Link to="/pos/active-orders" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
              <ShoppingCart size={16} />
              Ver ordenes activas
            </Link>
          )}
        </div>
      )}

      {(summary.productsWithoutRecipe > 0 || summary.productsWithoutCost > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-black text-amber-950">Rentabilidad incompleta</h3>
              <p className="text-sm font-medium text-amber-800">
                {summary.productsWithoutRecipe || 0} producto(s) sin receta y {summary.productsWithoutCost || 0} con costo pendiente.
              </p>
            </div>
          </div>
          <Link to="/admin/catalog" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
            Configurar recetas
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                Ventas por hora
              </h3>
              <p className="text-sm text-slate-500">Basado en pagos liquidados, no en ordenes abiertas.</p>
            </div>
            <button
              onClick={() => data.onExportExcel?.(hourlyData.map((hour) => ({
                Hora: `${hour.hour}:00`,
                Ventas: formatCurrency(hour.sales),
                Ordenes: hour.orders,
                'Ticket promedio': formatCurrency(hour.avgTicket),
                Estado: hour.peak ? 'Hora pico' : 'Normal'
              })), `ventas-por-hora-${new Date().toISOString().split('T')[0]}.xlsx`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors"
            >
              <FileText size={15} />
              Excel
            </button>
          </div>

          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="salesByHour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Ventas']} labelFormatter={(label) => `${label}:00`} />
                <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} fill="url(#salesByHour)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-2">Mix de pago</h3>
          <p className="text-sm text-slate-500 mb-6">Distribucion de cobros del periodo.</p>
          {pieData.length > 0 ? (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={88} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-5">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="font-black text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-center text-sm text-slate-500">
              Sin pagos registrados para graficar.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
