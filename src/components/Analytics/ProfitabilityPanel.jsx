import { useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { fetchProfitabilityData } from '@/features/analytics/profitabilityEngine'

const TABS = [
  { id: 'products', label: 'Productos' },
  { id: 'categories', label: 'Categorías' },
  { id: 'hours', label: 'Horario' },
  { id: 'days', label: 'Días' },
]

export default function ProfitabilityPanel({ branchId }) {
  const [tab, setTab] = useState('products')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    fetchProfitabilityData(branchId, days)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [branchId, days])

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-slate-500 text-sm">
        Analizando rentabilidad...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
        <AlertTriangle size={16} /> {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${tab === t.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          className="text-sm border border-slate-200 rounded-md px-2 py-1.5"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>7 días</option>
          <option value={30}>30 días</option>
          <option value={90}>90 días</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={DollarSign} label="Ingresos" value={`$${data.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
        <MetricCard icon={TrendingDown} label="Costos" value={`$${data.totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
        <MetricCard icon={TrendingUp} label="Ganancia" value={`$${data.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} color="text-green-600" />
      </div>

      {tab === 'products' && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Ingresos</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Ganancia</th>
                <th className="px-4 py-3 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.products.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{p.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-700">${p.revenue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">${p.cost.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${p.profit.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.margin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.categories.map((cat, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">{cat.category}</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Productos</span>
                  <span>{cat.products}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ingresos</span>
                  <span>${cat.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold border-t border-slate-100 pt-1 mt-1">
                  <span>Ganancia</span>
                  <span>${cat.profit.toFixed(2)} ({cat.margin.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'hours' && (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {data.hourly.map((h, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <p className="text-xs text-slate-400">{h.hour}:00</p>
              <p className="text-lg font-bold text-slate-900">{h.orders}</p>
              <p className="text-xs text-slate-500">pedidos</p>
              <p className="text-xs text-green-600 font-medium">${h.revenue.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'days' && (
        <div className="grid grid-cols-7 gap-2">
          {data.byDay.map((d, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <p className="text-sm font-semibold text-slate-900">{d.dayName}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{d.orders}</p>
              <p className="text-xs text-slate-500">pedidos</p>
              <p className="text-sm text-green-600 font-medium mt-1">${d.revenue.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color = 'text-slate-900' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
