import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, FileText, Package, ShoppingCart, Target } from 'lucide-react'
import { MetricCard } from './MetricCards'

export default function ForecastView({ data, formatCurrency, onGeneratePDF, onOpenReceiptModal }) {
  const forecast = data.forecast || {}
  const items = forecast.items || []
  const reorderItems = items.filter((item) => item.toBuy > 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          title="Compra sugerida"
          value={formatCurrency(forecast.totalEstimatedCost || 0)}
          change={null}
          icon={<ShoppingCart size={22} />}
          colorClass="text-primary"
        />
        <MetricCard
          title="Insumos a pedir"
          value={reorderItems.length}
          change={null}
          icon={<Package size={22} />}
          colorClass="text-blue-600"
        />
        <MetricCard
          title="Stock critico"
          value={forecast.urgentCount || 0}
          change={null}
          icon={<AlertTriangle size={22} />}
          colorClass="text-rose-600"
        />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-black text-slate-900">Forecast de compra</h3>
            <p className="text-sm text-slate-500">Basado en consumo historico, recetas y stock actual.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onGeneratePDF}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-widest"
            >
              <FileText size={16} />
              Generar PDF
            </button>
            <Link to="/admin/purchases" className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest">
              <ShoppingCart size={16} />
              Crear compra
            </Link>
            <button
              onClick={onOpenReceiptModal}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 disabled:text-slate-400 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              <Package size={16} />
              Ingresar stock
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Insumo</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Stock</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Minimo</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Demanda 7 dias</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Pedir</th>
                <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Costo estimado</th>
                <th className="px-5 py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const needsBuy = item.toBuy > 0
                const isUrgent = item.currentStock < item.minStock

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900">{item.name}</div>
                      <div className="text-xs font-medium text-slate-500">{item.unit}</div>
                    </td>
                    <td className={`px-5 py-4 text-right font-black ${isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
                      {Number(item.currentStock || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-600">{Number(item.minStock || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-600">{Number(item.neededNextWeek || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">{Number(item.toBuy || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrency(item.estimatedCost || 0)}</td>
                    <td className="px-5 py-4 text-center">
                      {needsBuy ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-black">
                          <ShoppingCart size={12} />
                          Comprar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">
                          <CheckCircle2 size={12} />
                          Cubierto
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="py-20 px-6 text-center">
            <Target size={42} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-900">Sin forecast disponible</h3>
            <p className="text-sm text-slate-500 mt-1">Registra ventas cerradas y recetas para generar sugerencias de compra.</p>
          </div>
        )}
      </section>
    </div>
  )
}
