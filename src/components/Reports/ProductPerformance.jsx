import { BarChart3, Coffee, TrendingUp, Package, Star } from 'lucide-react'
import { 
  BarChart, Bar, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'

const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];

export default function ProductPerformance({ data, formatCurrency }) {
  const top10 = data.topProducts || []

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Ranking Header Card */}
      <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Star size={24} fill="currentColor" />
                </div>
                Productos Estrella (Top Ingresos)
              </h3>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2 px-1 border-l-4 border-primary ml-1 pl-4">Auditando el 80/20 de tu menú</p>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 flex items-center gap-4">
               <Package className="text-slate-300" size={20} />
               <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{top10.length} SKU's Analizados</span>
            </div>
         </div>

         <div className="h-[500px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={top10} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="8 8" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#1e293b', fontWeight: 900, fontSize: 11}} 
                  width={200}
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc', radius: [0, 20, 20, 0]}}
                   contentStyle={{
                     borderRadius: '2rem', 
                     border: '1px solid #f1f5f9', 
                     boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)',
                     padding: '1.5rem',
                     fontWeight: 900,
                     fontSize: '12px'
                   }}
                   formatter={(value) => [formatCurrency(value), 'RECAUDACIÓN BRUTA']}
                   labelStyle={{color: '#10b981', marginBottom: '8px', textTransform: 'uppercase'}}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 20, 20, 0]} barSize={40}>
                   {top10.map((_, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                </Bar>
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {top10.slice(0, 4).map((product, i) => (
           <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-primary hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
              {i === 0 && (
                <div className="absolute top-0 right-0">
                   <div className="bg-amber-400 text-amber-900 font-black text-[10px] px-8 py-2 rounded-bl-3xl uppercase tracking-[0.2em] shadow-lg">Ganador #1</div>
                </div>
              )}
              <div className="flex items-center gap-8">
                <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-inner transform group-hover:rotate-12 transition-all ${
                  i === 0 ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-slate-50 text-slate-300 border border-slate-100'
                }`}>
                   <Coffee size={36} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-3 group-hover:text-primary transition-colors">{product.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-50 text-emerald-600 font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                       <TrendingUp size={10} />
                       {(product.profitability * 100).toFixed(1)}% Rentabilidad
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(product.revenue)}</p>
                <div className="bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 mt-2 flex items-center justify-end gap-2">
                   <Package size={14} className="text-slate-300" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.quantity} Uds.</span>
                </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  )
}
