import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, CreditCard, DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { useExecutiveDashboard } from '@/features/dashboard/useExecutiveDashboard'
import { useBranchStore } from '@/store/branchStore'

export default function ExecutiveDashboard() {
  const { currentBranch } = useBranchStore()
  const { data, loading, error, refresh } = useExecutiveDashboard(currentBranch?.id)

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-semibold">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertTriangle className="mx-auto mb-2" size={32} />
        <p className="font-semibold">Error al cargar dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={refresh} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Reintentar</button>
      </div>
    )
  }

  if (!data) return null

  const { realtime, comparisons, monthly, customers, operations, forecast, anomalies } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Ejecutivo</h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentBranch?.name} — Actualizado {new Date(data.generatedAt).toLocaleTimeString('es-MX')}
          </p>
        </div>
        <button onClick={refresh} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Refrescar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="Ventas Hoy"
          value={`$${(realtime.todayRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtitle={`${realtime.todayOrders} pedidos`}
          trend={comparisons.revenueChange}
          trendLabel="vs ayer"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Ticket Promedio"
          value={`$${(realtime.todayAvgTicket || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtitle={`${realtime.todayCompleted} completados`}
        />
        <KpiCard
          icon={TrendingUp}
          label="Proyección Mensual"
          value={`$${(monthly.projected || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`}
          subtitle={`$${(monthly.revenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} este mes`}
        />
        <KpiCard
          icon={Users}
          label="Clientes"
          value={customers.total}
          subtitle={`${customers.vip} VIP · ${operations.activeStaff} activos`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Métodos de Pago Hoy</h3>
          <div className="space-y-2">
            {Object.entries(realtime.todayPaymentMethods || {}).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 capitalize">{method}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Segmentación</h3>
          <div className="space-y-2">
            {(customers.segments || []).slice(0, 4).map((seg) => (
              <div key={seg.segment} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-700">{seg.label}</span>
                </div>
                <span className="font-semibold text-slate-900">{seg.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Operaciones</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Personal activo</span>
              <span className="font-semibold text-slate-900">{operations.activeStaff}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Stock crítico</span>
              <span className={`font-semibold ${operations.criticalStock > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {operations.criticalStock}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Hora pico</span>
              <span className="font-semibold text-slate-900">{operations.peakHour}</span>
            </div>
          </div>
          {operations.criticalStockItems?.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs text-red-600 font-medium mb-1">Stock bajo:</p>
              {operations.criticalStockItems.map((item) => (
                <p key={item.id} className="text-xs text-slate-500">{item.name}: {item.quantity}/{item.minStock}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {forecast && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Pronóstico 7 Días</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${forecast.trend === 'up' ? 'text-green-600' : forecast.trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
                {forecast.trend === 'up' ? <ArrowUp size={14} /> : forecast.trend === 'down' ? <ArrowDown size={14} /> : null}
                Promedio diario: ${(forecast.averageDaily || 0).toLocaleString('es-MX')}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {(forecast.next7Days || []).map((day, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-slate-400">{new Date(day.date).toLocaleDateString('es-MX', { weekday: 'short' })}</p>
                  <p className="text-sm font-semibold text-slate-900">${(day.predicted || 0).toLocaleString('es-MX')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Anomalías Detectadas</h3>
          {anomalies.length === 0 ? (
            <p className="text-sm text-slate-500">Sin anomalías en los últimos 30 días</p>
          ) : (
            <div className="space-y-2">
              {anomalies.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{a.date}</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900">${(a.value || 0).toLocaleString('es-MX')}</span>
                    <span className="text-slate-400 ml-1">(esperado: ${(a.expected || 0).toLocaleString('es-MX')})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, subtitle, trend, trendLabel }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-slate-500">{subtitle}</p>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
            {trendLabel && <span className="text-slate-400 ml-0.5">{trendLabel}</span>}
          </span>
        )}
      </div>
    </div>
  )
}
