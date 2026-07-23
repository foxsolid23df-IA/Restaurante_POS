import { supabase } from '@/lib/supabase'
import { calculateRFM, getSegmentStats } from '@/features/analytics/customerSegmentation'
import { calculateProductProfitability, calculateCategoryProfitability, calculateHourlyProfitability } from '@/features/analytics/profitabilityEngine'
import { fetchSeasonalForecast } from '@/features/analytics/seasonalForecast'
import { detectAnomalies } from '@/features/analytics/forecastEngine'

const KPI_CACHE_TTL = 300000

let _cache = {}
function getCached(key) {
  const entry = _cache[key]
  if (!entry) return null
  if (Date.now() - entry.ts > KPI_CACHE_TTL) {
    delete _cache[key]
    return null
  }
  return entry.data
}
function setCache(key, data) {
  _cache[key] = { data, ts: Date.now() }
}

export async function fetchExecutiveDashboard(branchId) {
  const cacheKey = `exec_dash_${branchId}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const yesterdayEnd = todayStart

  const [todayRes, yesterdayRes, monthRes, ordersRes, productsRes, inventoryRes, staffRes] = await Promise.all([
    supabase.from('orders').select('id, total_amount, status, payment_status, created_at').eq('branch_id', branchId).gte('created_at', todayStart),
    supabase.from('orders').select('id, total_amount, status, payment_status, created_at').eq('branch_id', branchId).gte('created_at', yesterdayStart).lt('created_at', yesterdayEnd),
    supabase.from('orders').select('id, total_amount, status, created_at, customer_id').eq('branch_id', branchId).gte('created_at', monthStart).order('created_at', { ascending: false }).limit(500),
    supabase.from('order_items').select('product_id, quantity, unit_price, products(name, category:product_categories(name)), created_at').eq('branch_id', branchId).gte('created_at', yesterdayStart).limit(200),
    supabase.from('inventory_items').select('id, name, quantity, min_stock').eq('branch_id', branchId).lt('quantity', supabase.rpc('get_column_ref', { p_table: 'inventory_items', p_column: 'min_stock' })),
    supabase.from('staff').select('id, role, is_active').eq('branch_id', branchId),
  ])

  const todayOrders = todayRes.data || []
  const yesterdayOrders = yesterdayRes.data || []
  const monthOrders = monthRes.data || []
  const recentItems = productsRes.data || []
  const inventory = inventoryRes.data || []
  const staff = staffRes.data || []

  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const todayOrdersCount = todayOrders.length
  const todayCompleted = todayOrders.filter((o) => o.status === 'completed').length
  const todayAvgTicket = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0

  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

  const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const monthOrdersCount = monthOrders.length
  const monthAvgTicket = monthOrdersCount > 0 ? monthRevenue / monthOrdersCount : 0
  const projectedMonthly = (monthRevenue / now.getDate()) * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const paymentMethods = todayOrders.reduce((map, o) => {
    const method = o.payment_status || 'pending'
    map[method] = (map[method] || 0) + 1
    return map
  }, {})

  const hourly = calculateHourlyProfitability(todayOrders.map((o) => ({ ...o, items: [] })))
  const peakHour = hourly.reduce((best, h) => h.orders > (best?.orders || 0) ? h : best, null)

  const segments = calculateRFM(monthOrders.filter((o) => o.customer_id))
  const segmentStats = getSegmentStats(segments)
  const vipCount = segmentStats.find((s) => s.segment === 'champions')?.count || 0

  const anomalies = detectAnomalies(
    monthOrders
      .filter((o) => o.created_at)
      .reduce((map, o) => {
        const date = o.created_at.split('T')[0]
        map[date] = (map[date] || 0) + Number(o.total_amount || 0)
        return map
      }, {}),
    2,
  )

  const criticalStock = inventory.filter((i) => Number(i.quantity) <= Number(i.min_stock || 0))
  const activeStaff = staff.filter((s) => s.is_active).length

  const forecast = await fetchSeasonalForecast(branchId, { daysHistory: 60, forecastHorizon: 7 }).catch(() => null)

  const dashboard = {
    realtime: {
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayOrders: todayOrdersCount,
      todayCompleted,
      todayAvgTicket: Math.round(todayAvgTicket * 100) / 100,
      todayPending: todayOrdersCount - todayCompleted,
      todayPaymentMethods: paymentMethods,
    },
    comparisons: {
      yesterdayRevenue: Math.round(yesterdayRevenue * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      revenueTrend: revenueChange > 0 ? 'up' : 'down',
    },
    monthly: {
      revenue: Math.round(monthRevenue * 100) / 100,
      orders: monthOrdersCount,
      avgTicket: Math.round(monthAvgTicket * 100) / 100,
      projected: Math.round(projectedMonthly * 100) / 100,
    },
    customers: {
      total: segments.length,
      vip: vipCount,
      segments: segmentStats,
    },
    operations: {
      activeStaff,
      criticalStock: criticalStock.length,
      criticalStockItems: criticalStock.slice(0, 5).map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, minStock: i.min_stock })),
      peakHour: peakHour ? `${peakHour.hour}:00` : '—',
    },
    forecast: forecast ? {
      next7Days: forecast.forecasts?.slice(0, 7).map((f) => ({ date: f.date, predicted: Math.round(f.predicted) })),
      averageDaily: Math.round(forecast.averageDaily || 0),
      trend: forecast.trend > 0 ? 'up' : forecast.trend < 0 ? 'down' : 'stable',
    } : null,
    anomalies: (Array.isArray(anomalies) ? anomalies : []).slice(0, 5).map((a) => ({
      index: a.index,
      date: monthOrders[a.index]?.created_at?.split('T')[0] || '—',
      value: Math.round(a.value * 100) / 100,
      expected: Math.round((a.expected || a.value) * 100) / 100,
      zScore: Math.round(a.zScore * 100) / 100,
    })),
    generatedAt: new Date().toISOString(),
  }

  setCache(cacheKey, dashboard)
  return dashboard
}

export function invalidateDashboardCache(branchId) {
  const cacheKey = `exec_dash_${branchId}`
  delete _cache[cacheKey]
}
