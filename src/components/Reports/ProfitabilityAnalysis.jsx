import { TrendingUp, TrendingDown, Zap, PieChart, Activity, DollarSign } from 'lucide-react'
import { 
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, Cell
} from 'recharts'
import { MetricCard } from './MetricCards'

export default function ProfitabilityAnalysis({ data, formatCurrency }) {
  const history = data.costVsSales?.history || []

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <MetricCard 
          title="Utilidad Neta (Sim.)" 
          value={formatCurrency(data.costVsSales?.totals?.profit || 0)} 
          change={null}
          icon={<TrendingUp size={24} />}
          colorClass="text-primary"
        />
        <MetricCard 
          title="Inversión en Insumos" 
          value={formatCurrency(data.costVsSales?.totals?.costs || 0)} 
          change={null}
          icon={<TrendingDown size={24} />}
          colorClass="text-rose-500"
        />
        <MetricCard 
          title="Margen Operativo" 
          value={`${(data.costVsSales?.totals?.avgMargin || 0).toFixed(1)}%`} 
          change={null}
          icon={<Zap size={24} />}
          colorClass="text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Sales vs Costs Bar Chart */}
        <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <PieChart size={20} />
                </div>
                Equilibrio Operativo
              </h3>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2 px-1">Ratio de adquisición vs venta directa</p>
            </div>
          </div>
          
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                  tickFormatter={(v) => v.split('-').slice(2).join('/')} 
                  dy={15}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                   tickFormatter={(v) => `$${v}`}
                   dx={-10}
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{
                     borderRadius: '2rem', 
                     border: '1px solid #f1f5f9', 
                     boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)',
                     padding: '1.5rem',
                     fontWeight: 900,
                     fontSize: '12px'
                   }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '30px', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Bar dataKey="sales" name="Ingresos" fill="#10b981" radius={[12, 12, 0, 0]} barSize={25} />
                <Bar dataKey="costs" name="Costos" fill="#ef4444" radius={[12, 12, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Margin Evolution Area Chart */}
        <div className="bg-slate-950 rounded-[4rem] p-12 text-white shadow-3xl relative overflow-hidden flex flex-col justify-between border-4 border-slate-900 group">
           <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="relative z-10">
              <h3 className="text-2xl font-black mb-12 flex items-center gap-4 uppercase tracking-tighter text-white">
                <div className="bg-white/10 p-3 rounded-2xl text-emerald-400">
                  <Activity size={20} />
                </div>
                Fluctuación del Margen %
              </h3>
              
              <div className="h-[300px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ffffff10" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}}
                      tickFormatter={(v) => v.split('-').slice(2).join('/')} 
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.5rem', fontWeight: 900}}
                    />
                    <Area type="monotone" dataKey="margin" name="Margen Bruto" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorMargin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/5 shadow-2xl">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-primary shadow-inner border border-emerald-500/20">
                    <DollarSign size={24} />
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Punto de Equilibrio Estimado</p>
                    <p className="text-2xl font-black text-white tracking-tighter leading-none">{formatCurrency((data.costVsSales?.totals?.costs || 0) * 1.5)}/per</p>
                 </div>
                 <div className="bg-emerald-500/20 text-emerald-400 font-black text-[10px] px-5 py-2 rounded-xl uppercase tracking-widest border border-emerald-500/30">Estable</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
