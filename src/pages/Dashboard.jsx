import { Suspense } from 'react'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  Users, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts'
import { useDashboardStats } from '@/features/admin/hooks/useDashboardStats'

const data = [
  { name: 'Lun', sales: 4000 },
  { name: 'Mar', sales: 3000 },
  { name: 'Mie', sales: 2000 },
  { name: 'Jue', sales: 2780 },
  { name: 'Vie', sales: 1890 },
  { name: 'Sab', sales: 2390 },
  { name: 'Dom', sales: 3490 },
]

function DashboardContent() {
  const { stats } = useDashboardStats()

  const summaryCards = [
    {
      title: 'Ventas de Hoy',
      value: `$${stats.todaySales.toFixed(0)}`,
      icon: DollarSign,
      color: 'secondary',
      trend: '+12.5%',
      isPositive: true,
      description: 'Ingresos reportados hoy'
    },
    {
      title: 'Ticket Promedio',
      value: `$${stats.averageTicket.toFixed(0)}`,
      icon: Target,
      color: 'success',
      trend: '+5.2%',
      isPositive: true,
      description: 'Valor promedio por orden'
    },
    {
      title: 'Órdenes Activas',
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: 'warning',
      trend: '-2.4%',
      isPositive: false,
      description: 'Total de servicios completados'
    },
    {
      title: 'Items Bajo Stock',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'rose',
      trend: stats.lowStockItems > 5 ? 'Crítico' : 'Normal',
      isWarning: stats.lowStockItems > 0,
      description: 'Requiere revisión inmediata'
    }
  ]

  return (
    <div className="p-10 space-y-10 bg-[#f8fafc] font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight font-display">Executive Dashboard</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-[0.15em] text-[10px]">Visión General Operativa</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">Descargar Reporte</button>
          <button className="px-6 py-3 bg-secondary rounded-2xl font-black text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 tracking-tight">Nuevo Movimiento</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {summaryCards.map((card, index) => (
          <div key={index} className="premium-card p-8 group transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${
                card.color === 'secondary' ? 'bg-blue-50 text-secondary' :
                card.color === 'success' ? 'bg-emerald-50 text-success' :
                card.color === 'warning' ? 'bg-orange-50 text-warning' :
                'bg-rose-50 text-rose-600'
              } shadow-inner`}>
                <card.icon size={28} strokeWidth={2.5} />
              </div>
              <div className={`flex items-center gap-1 font-black text-sm ${
                card.isPositive ? 'text-success' : 'text-rose-600'
              }`}>
                {card.isPositive ? <ArrowUpRight size={16} strokeWidth={3} /> : <ArrowDownRight size={16} strokeWidth={3} />}
                {card.trend}
              </div>
            </div>
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-2">{card.title}</h3>
            <div className="text-3xl font-black text-primary tracking-tight mb-2 font-display">{card.value}</div>
            <p className="text-slate-400 font-medium text-[11px]">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 premium-card p-10 bg-white">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-primary tracking-tight font-display">Ventas por Semana</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Comparativa de ingresos diarios</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <div className="w-2.5 h-2.5 bg-secondary rounded-full" /> Esta Semana
              </span>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dx={-15}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 800 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#2563eb" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary View (Operational Health) */}
        <div className="premium-card p-10 bg-primary text-white border-none shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <h2 className="text-2xl font-black tracking-tight mb-2 relative z-10 font-display">Estado Operativo</h2>
          <p className="text-slate-400 text-sm font-bold mb-10 tracking-wide uppercase text-[10px] relative z-10">Real-time Health Check</p>
          
          <div className="space-y-8 relative z-10">
            <HealthIndicator label="Efectivo en Caja" value={stats.cashSales} color="success" target={5000} />
            <HealthIndicator label="Ventas con Tarjeta" value={stats.cardSales} color="secondary" target={10000} />
            <HealthIndicator label="Productos Activos" value={stats.totalProducts} color="warning" target={100} />
            <HealthIndicator label="Rendimiento Semanal" value={78} color="indigo" target={100} isPercentage />
          </div>

          <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h4 className="font-black text-rose-100 uppercase tracking-[0.2em] text-[10px]">Alerta Crítica</h4>
            </div>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              Hay <span className="text-white font-black">{stats.lowStockItems}</span> productos con stock crítico. Requiere reposición.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HealthIndicator({ label, value, color, target, isPercentage = false }) {
  const percent = isPercentage ? value : (value / target) * 100
  const colors = {
    success: "bg-success shadow-emerald-500/20",
    secondary: "bg-secondary shadow-blue-500/20",
    warning: "bg-warning shadow-orange-500/20",
    indigo: "bg-indigo-500 shadow-indigo-500/20",
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-lg font-black font-display">{isPercentage ? `${value}%` : `$${value.toFixed(0)}`}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-1000 ease-out shadow-lg`} 
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary/10 border-t-secondary" />
          <p className="font-black text-slate-400 animate-pulse uppercase tracking-[0.3em] text-[10px]">Manager Hub Sincronizando...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
