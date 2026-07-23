import { supabase } from '@/lib/supabase'

const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
}

const ALERT_TYPES = {
  STOCK_CRITICAL: 'stock_critical',
  STOCK_FORECAST: 'stock_forecast',
  SALES_ANOMALY: 'sales_anomaly',
  SLOW_MOVING: 'slow_moving',
  EXPIRY: 'expiry',
}

const ALERT_CACHE_TTL = 120000
let _alertCache = {}

export { ALERT_SEVERITY, ALERT_TYPES }

function getCached(key) {
  const entry = _alertCache[key]
  if (!entry) return null
  if (Date.now() - entry.ts > ALERT_CACHE_TTL) return null
  return entry.data
}

function setCache(key, data) {
  _alertCache[key] = { data, ts: Date.now() }
}

export function clearAlertCache() {
  _alertCache = {}
}

async function getAverageDailyUsage(branchId, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_id, quantity, created_at')
    .eq('branch_id', branchId)
    .gte('created_at', since)

  if (!orderItems) return {}

  const productCounts = {}
  orderItems.forEach((item) => {
    const pid = item.product_id
    if (!pid) return
    productCounts[pid] = (productCounts[pid] || 0) + Number(item.quantity || 1)
  })

  const usage = {}
  Object.entries(productCounts).forEach(([pid, total]) => {
    usage[pid] = total / days
  })

  return usage
}

async function getRecipeUsage(branchId) {
  const { data: recipes } = await supabase
    .from('product_recipes')
    .select('product_id, ingredient_id, quantity')

  if (!recipes) return {}

  const ingredientMap = {}
  recipes.forEach((r) => {
    if (!ingredientMap[r.product_id]) ingredientMap[r.product_id] = []
    ingredientMap[r.product_id].push({ ingredientId: r.ingredient_id, quantity: Number(r.quantity || 0) })
  })

  return ingredientMap
}

export async function checkStockAlerts(branchId) {
  const cacheKey = `stock_alerts_${branchId}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const alerts = []

  const [inventoryRes, usageMap, recipeMap] = await Promise.all([
    supabase.from('inventory_items').select('id, name, quantity, unit, min_stock, max_stock, category, expiry_date').eq('branch_id', branchId),
    getAverageDailyUsage(branchId),
    getRecipeUsage(branchId),
  ])

  const inventory = inventoryRes.data || []

  inventory.forEach((item) => {
    const qty = Number(item.quantity || 0)
    const minStock = Number(item.min_stock || 0)
    const dailyUsage = usageMap[item.id] || 0

    if (qty <= minStock && minStock > 0) {
      alerts.push({
        type: ALERT_TYPES.STOCK_CRITICAL,
        severity: ALERT_SEVERITY.CRITICAL,
        itemId: item.id,
        itemName: item.name,
        currentQty: qty,
        minStock,
        daysRemaining: dailyUsage > 0 ? Math.round(qty / dailyUsage) : 0,
        message: `${item.name} está por debajo del mínimo (${qty} / ${minStock})`,
      })
    }

    if (dailyUsage > 0 && qty > 0) {
      const daysUntilEmpty = Math.round(qty / dailyUsage)
      if (daysUntilEmpty <= 3 && daysUntilEmpty > 0) {
        alerts.push({
          type: ALERT_TYPES.STOCK_FORECAST,
          severity: daysUntilEmpty <= 1 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
          itemId: item.id,
          itemName: item.name,
          currentQty: qty,
          dailyUsage: Math.round(dailyUsage * 100) / 100,
          daysRemaining: daysUntilEmpty,
          message: `${item.name} se agotará en ~${daysUntilEmpty} días al ritmo actual`,
        })
      }
    }

    if (dailyUsage > 0 && qty > minStock * 3) {
      const weeksSupply = qty / dailyUsage
      if (weeksSupply > 8) {
        alerts.push({
          type: ALERT_TYPES.SLOW_MOVING,
          severity: ALERT_SEVERITY.INFO,
          itemId: item.id,
          itemName: item.name,
          currentQty: qty,
          weeksSupply: Math.round(weeksSupply),
          message: `${item.name} tiene inventario para ~${Math.round(weeksSupply)} semanas`,
        })
      }
    }

    if (item.expiry_date) {
      const expiryDate = new Date(item.expiry_date)
      const daysToExpiry = Math.round((expiryDate - Date.now()) / 86400000)
      if (daysToExpiry <= 14 && daysToExpiry > 0) {
        alerts.push({
          type: ALERT_TYPES.EXPIRY,
          severity: daysToExpiry <= 3 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
          itemId: item.id,
          itemName: item.name,
          expiryDate: item.expiry_date,
          daysToExpiry,
          qty,
          message: `${item.name} vence en ${daysToExpiry} días (${qty} ${item.unit || 'unidades'})`,
        })
      }
    }
  })

  const sorted = alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const result = { alerts: sorted, total: sorted.length, critical: sorted.filter((a) => a.severity === ALERT_SEVERITY.CRITICAL).length }
  setCache(cacheKey, result)
  return result
}

export async function checkSalesAnomalies(branchId) {
  const cacheKey = `sales_anomalies_${branchId}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('branch_id', branchId)
    .eq('status', 'completed')
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .order('created_at', { ascending: true })

  if (!orders || orders.length < 7) return { anomalies: [], total: 0 }

  const dailyTotals = orders.reduce((map, o) => {
    const date = o.created_at.split('T')[0]
    map[date] = (map[date] || 0) + Number(o.total_amount || 0)
    return map
  }, {})

  const entries = Object.entries(dailyTotals).sort(([a], [b]) => a.localeCompare(b))
  const values = entries.map(([, v]) => v)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)

  const anomalies = entries
    .map(([date, value]) => {
      const zScore = Math.abs((value - mean) / (std || 1))
      return { date, value, zScore: Math.round(zScore * 100) / 100, expected: Math.round(mean * 100) / 100, isAnomaly: zScore > 2 }
    })
    .filter((a) => a.isAnomaly)
    .slice(0, 10)

  const result = { anomalies, total: anomalies.length }
  setCache(cacheKey, result)
  return result
}

export async function getAllAlerts(branchId) {
  const [stock, sales] = await Promise.all([
    checkStockAlerts(branchId),
    checkSalesAnomalies(branchId),
  ])

  return {
    alerts: [...stock.alerts, ...sales.anomalies.map((a) => ({
      type: ALERT_TYPES.SALES_ANOMALY,
      severity: a.zScore > 3 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
      date: a.date,
      value: a.value,
      expected: a.expected,
      zScore: a.zScore,
      message: `Venta atípica el ${a.date}: $${Math.round(a.value)} (esperado: $${Math.round(a.expected)})`,
    }))].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    }),
    totalStock: stock.total,
    totalSales: sales.total,
    critical: stock.critical + sales.anomalies.filter((a) => a.zScore > 3).length,
  }
}
