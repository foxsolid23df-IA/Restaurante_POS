import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import { fetchSeasonalForecast } from '@/features/analytics/seasonalForecast'

export default function DemandForecastChart({ branchId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [horizon, setHorizon] = useState(14)

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    fetchSeasonalForecast(branchId, { daysHistory: 90, forecastHorizon: horizon, period: 7 })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [branchId, horizon])

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-slate-500 text-sm">
        Calculando pronóstico...
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

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No hay suficientes datos históricos para generar un pronóstico (mín. 14 días).
      </div>
    )
  }

  const maxValue = Math.max(
    ...(data.historical || []).map((d) => d.value),
    ...(data.forecasts || []).map((f) => f.upper || f.predicted),
    1,
  )

  const chartHeight = 200
  const chartWidth = 100
  const recentHistorical = (data.historical || []).slice(-30)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900">Pronóstico de Demanda</h3>
        </div>
        <select
          className="text-sm border border-slate-200 rounded-md px-2 py-1.5"
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
        >
          <option value={7}>7 días</option>
          <option value={14}>14 días</option>
          <option value={30}>30 días</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Proyección Total</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ${(data.totalProjected || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Promedio Diario</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ${(data.averageDaily || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Tendencia</p>
          <p className={`text-xl font-bold mt-1 ${(data.trend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(data.trend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(data.trend || 0).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Histórico
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Pronóstico
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-yellow-300" /> Intervalo
          </div>
        </div>

        <div className="relative" style={{ height: chartHeight, width: '100%' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            {recentHistorical.map((d, i) => {
              const x = (i / Math.max(recentHistorical.length - 1, 1)) * chartWidth
              const y = chartHeight - (d.value / maxValue) * chartHeight * 0.8 - 10
              return i === 0 ? null : (
                <line
                  key={`hist-${i}`}
                  x1={( (i - 1) / Math.max(recentHistorical.length - 1, 1) ) * chartWidth}
                  y1={chartHeight - (recentHistorical[i - 1].value / maxValue) * chartHeight * 0.8 - 10}
                  x2={x}
                  y2={y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              )
            })}

            {(data.forecasts || []).map((f, i) => {
              const x = ((recentHistorical.length + i) / (recentHistorical.length + (data.forecasts || []).length - 1 || 1)) * chartWidth
              const y = chartHeight - (f.predicted / maxValue) * chartHeight * 0.8 - 10
              const yLower = chartHeight - ((f.lower || f.predicted) / maxValue) * chartHeight * 0.8 - 10
              const yUpper = chartHeight - ((f.upper || f.predicted) / maxValue) * chartHeight * 0.8 - 10

              return (
                <g key={`fc-${i}`}>
                  <rect
                    x={x - (chartWidth / (recentHistorical.length + (data.forecasts || []).length)) * 0.4}
                    y={Math.min(yLower, yUpper)}
                    width={(chartWidth / (recentHistorical.length + (data.forecasts || []).length)) * 0.8}
                    height={Math.abs(yUpper - yLower)}
                    fill="#fef08a"
                    opacity="0.5"
                  />
                  <circle cx={x} cy={y} r="2" fill="#22c55e" />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{recentHistorical[0]?.date || '—'}</span>
          <span>Hoy</span>
          <span>{data.forecasts?.[data.forecasts.length - 1]?.date || '—'}</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Pronóstico</th>
              <th className="px-4 py-3 text-right">Mín.</th>
              <th className="px-4 py-3 text-right">Máx.</th>
              <th className="px-4 py-3 text-right">Evento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data.forecasts || []).map((f, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {new Date(f.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">${(f.predicted || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-500">${(f.lower || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-500">${(f.upper || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  {f.event ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Calendar size={10} /> {f.event}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
