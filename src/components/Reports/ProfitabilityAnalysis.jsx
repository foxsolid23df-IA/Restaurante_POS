import { Link } from 'react-router-dom'
import { AlertTriangle, PackageSearch, TrendingDown, TrendingUp, Utensils } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { MetricCard } from './MetricCards'

export default function ProfitabilityAnalysis({ data, formatCurrency }) {
  const history = data.costVsSales?.history || []
  const totals = data.costVsSales?.totals || {}
  const summary = data.currentSummary || {}

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <MetricCard
          title="Utilidad bruta"
          value={formatCurrency(totals.profit || 0)}
          change={null}
          icon={<TrendingUp size={22} />}
          colorClass="text-emerald-600"
        />
        <MetricCard
          title="Costo por receta"
          value={formatCurrency(totals.costs || 0)}
          change={null}
          icon={<TrendingDown size={22} />}
          colorClass="text-rose-600"
        />
        <MetricCard
          title="Margen bruto"
          value={`${Number(totals.avgMargin || 0).toFixed(1)}%`}
          change={null}
          icon={<Utensils size={22} />}
          colorClass="text-slate-900"
        />
      </div>

      {(summary.productsWithoutRecipe > 0 || summary.productsWithoutCost > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-black text-amber-950">Margen parcial</h3>
              <p className="text-sm font-medium text-amber-800">
                El margen excluye costos no configurados. Revisa recetas e insumos para cerrar la lectura financiera.
              </p>
            </div>
          </div>
          <Link to="/admin/catalog" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
            <PackageSearch size={16} />
            Ver productos
          </Link>
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900">Ventas contra costo de receta</h3>
          <p className="text-sm text-slate-500">Utilidad bruta por dia, calculada desde pagos liquidados y recetas.</p>
        </div>

        {history.some((day) => day.sales > 0) ? (
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(value) => value.split('-').slice(1).join('/')} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="sales" name="Ventas" fill="#059669" radius={[8, 8, 0, 0]} />
                <Bar dataKey="costs" name="Costo receta" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="text-lg font-black text-slate-900">Sin ventas para rentabilidad</h3>
            <p className="text-sm text-slate-500 mt-1">Liquida pagos en caja para calcular utilidad bruta por receta.</p>
          </div>
        )}
      </section>
    </div>
  )
}
