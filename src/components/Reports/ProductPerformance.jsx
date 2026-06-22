import { Link } from 'react-router-dom'
import { AlertTriangle, BarChart3, Package, Settings, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

export default function ProductPerformance({ data, formatCurrency }) {
  const products = data.topProducts || []
  const needsConfig = products.filter((product) => product.requiresConfiguration)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {needsConfig.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-black text-amber-950">Productos sin margen confiable</h3>
              <p className="text-sm font-medium text-amber-800">
                {needsConfig.length} producto(s) vendidos requieren receta o costo de insumos.
              </p>
            </div>
          </div>
          <Link to="/admin/catalog" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
            <Settings size={16} />
            Revisar catalogo
          </Link>
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              Ranking de productos
            </h3>
            <p className="text-sm text-slate-500">Ingresos, unidades y margen bruto por receta.</p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest">
            <Package size={15} />
            {products.length} analizados
          </span>
        </div>

        {products.length > 0 ? (
          <div className="h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={190} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Ingresos' : 'Unidades']} />
                <Bar dataKey="revenue" fill="#059669" radius={[0, 10, 10, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="Sin productos vendidos" text="Cuando existan pagos liquidados se mostrara el ranking del periodo." />
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Detalle de rendimiento</h3>
          <Link to="/admin/purchases" className="text-xs font-black uppercase tracking-widest text-primary hover:text-emerald-700">
            Crear compra sugerida
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Producto</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Unidades</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Ingresos</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Costo receta</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Utilidad bruta</th>
                <th className="px-5 py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id || product.name} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-black text-slate-900">{product.name}</div>
                    <div className="text-xs font-medium text-slate-500">{product.category || 'Sin categoria'}</div>
                    {product.requiresConfiguration && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                        <AlertTriangle size={11} />
                        Configurar receta/costo
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-700">{Number(product.quantity || 0).toFixed(0)}</td>
                  <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrency(product.revenue || 0)}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-700">{formatCurrency(product.totalCost || 0)}</td>
                  <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrency(product.profit || 0)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                      product.requiresConfiguration
                        ? 'bg-amber-50 text-amber-700'
                        : Number(product.profitMargin || 0) >= 30
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                    }`}>
                      <TrendingUp size={12} />
                      {Number(product.profitMargin || 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <EmptyState title="Sin ventas de productos" text="No hay items pagados en este rango de fechas." />}
      </section>
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="py-16 px-6 text-center">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{text}</p>
    </div>
  )
}
