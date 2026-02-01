import { DollarSign, ShoppingCart, Target, Zap, Clock, Layers, Sparkles, FileText } from 'lucide-react'
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { MetricCard } from './MetricCards'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardOverview({ data, formatCurrency }) {
  const pieData = [
    { name: 'Efectivo', value: data.currentSummary?.cashSales || 0 },
    { name: 'Tarjeta', value: data.currentSummary?.cardSales || 0 },
    { name: 'Otros', value: data.currentSummary?.otherSales || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <MetricCard 
          title="Facturación Bruta" 
          value={formatCurrency(data.currentSummary?.totalSales || 0)} 
          change={data.comparison?.variance?.sales}
          icon={<DollarSign size={24} />}
          colorClass="text-emerald-600"
        />
        <MetricCard 
          title="Volumen de Pedidos" 
          value={data.currentSummary?.totalOrders || 0} 
          change={data.comparison?.variance?.orders}
          icon={<ShoppingCart size={24} />}
          colorClass="text-blue-600"
        />
        <MetricCard 
          title="Venta Promedio" 
          value={formatCurrency((data.currentSummary?.totalSales || 0) / (data.currentSummary?.totalOrders || 1))} 
          change={data.comparison?.variance?.avgTicket}
          icon={<Target size={24} />}
          colorClass="text-amber-600"
        />
        <MetricCard 
          title="Eficiencia Bruta" 
          value={`${(data.kpis?.profitMargin || 0).toFixed(1)}%`} 
          change={0}
          icon={<Zap size={24} />}
          colorClass="text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Sales Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Clock size={20} />
                </div>
                Monitor de Flujo Horario
              </h3>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2 px-1">Curva de ocupación y ventas por segmento</p>
            </div>

            <button
              onClick={() => {
                const excelData = (data.hourlyData || []).map(h => ({
                  'Hora': `${h.hour}:00`,
                  'Ventas Brutas': formatCurrency(h.sales),
                  'Número de Órdenes': h.orders,
                  'Ticket Promedio': formatCurrency(h.avgTicket),
                  'Estado': h.peak ? 'Hora Pico' : 'Normal'
                }));
                // Esta función se puede llamar directamente si exportToExcel está disponible
                // O podemos pasarla como prop. Por simplicidad, ya que useReports se usa en el padre,
                // voy a asumir que queremos una función local o pasada por props.
                if (data.onExportExcel) {
                  data.onExportExcel(excelData, `flujo-horario-${new Date().toISOString().split('T')[0]}.xlsx`);
                }
              }}
              className="group/btn flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-100 shadow-sm"
              title="Exportar a Excel"
            >
              <FileText size={14} className="group-hover/btn:text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
            </button>
          </div>
          
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <AreaChart data={data.hourlyData || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                  tickFormatter={(value) => `${value}:00`}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                  tickFormatter={(value) => `$${value}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4'}}
                  contentStyle={{
                    borderRadius: '2rem', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)',
                    padding: '1.5rem',
                    fontWeight: 900,
                    fontSize: '12px'
                  }}
                  formatter={(value) => [formatCurrency(value), 'RECAUDACIÓN']}
                  labelFormatter={(label) => `BLOQUE HORARIO: ${label}:00`}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Methods of Payment Card */}
        <div className="bg-slate-950 rounded-[4rem] p-12 text-white shadow-3xl relative overflow-hidden flex flex-col justify-between border-4 border-slate-900">
           <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="relative z-10">
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4 uppercase tracking-tighter">
                <div className="bg-white/10 p-3 rounded-2xl text-emerald-400">
                  <Layers size={20} />
                </div>
                Mix de Liquidación
              </h3>
              
              <div className="h-[220px] w-full relative mb-10">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.5rem', fontWeight: 900}}
                       itemStyle={{color: '#fff', fontSize: '10px'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Texto Central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center leading-none">Total<br/>Periodo</p>
                </div>
              </div>

              <div className="space-y-4">
                 {pieData.map((d, i) => (
                   <div key={d.name} className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full shadow-lg" style={{backgroundColor: COLORS[i]}} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{d.name}</span>
                      </div>
                      <span className="font-black text-lg tracking-tighter">{formatCurrency(d.value)}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="mt-12 p-6 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20 text-center relative z-10">
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                 <Sparkles size={12} />
                 Sincronización Bancaria Activa
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
