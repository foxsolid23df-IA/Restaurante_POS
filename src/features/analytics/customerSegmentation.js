import { supabase } from '@/lib/supabase'

const RFM_SEGMENTS = {
  CHAMPIONS: { name: 'Campeones', minRecency: 0, maxRecency: 30, minFrequency: 5, minMonetary: 5000, color: '#22c55e' },
  LOYAL: { name: 'Leales', minRecency: 0, maxRecency: 60, minFrequency: 3, minMonetary: 2000, color: '#3b82f6' },
  POTENTIAL: { name: 'Potenciales', minRecency: 0, maxRecency: 90, minFrequency: 2, minMonetary: 1000, color: '#8b5cf6' },
  NEW: { name: 'Nuevos', minRecency: 0, maxRecency: 30, minFrequency: 0, minMonetary: 0, color: '#06b6d4' },
  AT_RISK: { name: 'En Riesgo', minRecency: 90, maxRecency: 180, minFrequency: 2, minMonetary: 500, color: '#f59e0b' },
  LOST: { name: 'Perdidos', minRecency: 180, maxRecency: Infinity, minFrequency: 0, minMonetary: 0, color: '#ef4444' },
}

export function calculateRFM(orders) {
  const now = Date.now()
  const customerMap = {}

  orders.forEach((order) => {
    const customerId = order.customer_id
    if (!customerId) return

    if (!customerMap[customerId]) {
      customerMap[customerId] = { spent: 0, orderCount: 0, lastDate: 0, firstDate: now }
    }

    const c = customerMap[customerId]
    const orderDate = new Date(order.created_at || order.date).getTime()
    c.spent += Number(order.total_amount || order.total || 0)
    c.orderCount += 1
    if (orderDate > c.lastDate) c.lastDate = orderDate
    if (orderDate < c.firstDate) c.firstDate = orderDate
  })

  return Object.entries(customerMap).map(([customerId, data]) => {
    const daysSinceLastOrder = (now - data.lastDate) / 86400000
    const customerLifetime = (now - data.firstDate) / 86400000

    let segment = 'new'
    for (const [key, criteria] of Object.entries(RFM_SEGMENTS)) {
      if (
        daysSinceLastOrder >= criteria.minRecency &&
        daysSinceLastOrder < criteria.maxRecency &&
        data.orderCount >= criteria.minFrequency &&
        data.spent >= criteria.minMonetary
      ) {
        segment = key.toLowerCase()
        break
      }
    }

    const recencyScore = Math.max(0, Math.min(5, 5 - Math.floor(daysSinceLastOrder / 30)))
    const frequencyScore = Math.min(5, Math.floor(data.orderCount / 2))
    const monetaryScore = Math.min(5, Math.floor(data.spent / 1000))
    const rfmScore = recencyScore + frequencyScore + monetaryScore

    return {
      customerId,
      totalSpent: data.spent,
      orderCount: data.orderCount,
      daysSinceLastOrder: Math.round(daysSinceLastOrder),
      customerLifetime: Math.round(customerLifetime),
      segment,
      segmentInfo: RFM_SEGMENTS[segment.toUpperCase()] || RFM_SEGMENTS.NEW,
      recencyScore,
      frequencyScore,
      monetaryScore,
      rfmScore,
      churnProbability: daysSinceLastOrder > 90
        ? Math.min(0.95, 0.3 + (daysSinceLastOrder - 90) / 300)
        : Math.max(0.05, 0.3 - daysSinceLastOrder / 300),
    }
  }).sort((a, b) => b.rfmScore - a.rfmScore)
}

export function getSegmentStats(segments) {
  const stats = {}
  segments.forEach((s) => {
    if (!stats[s.segment]) {
      stats[s.segment] = { count: 0, totalSpent: 0, totalOrders: 0, customers: [] }
    }
    stats[s.segment].count += 1
    stats[s.segment].totalSpent += s.totalSpent
    stats[s.segment].totalOrders += s.orderCount
    stats[s.segment].customers.push(s.customerId)
  })
  return Object.entries(stats).map(([segment, data]) => ({
    segment,
    label: (RFM_SEGMENTS[segment.toUpperCase()] || {}).name || segment,
    color: (RFM_SEGMENTS[segment.toUpperCase()] || {}).color || '#94a3b8',
    ...data,
    averageSpent: data.count > 0 ? data.totalSpent / data.count : 0,
    averageOrders: data.count > 0 ? data.totalOrders / data.count : 0,
    percentage: segments.length > 0 ? (data.count / segments.length) * 100 : 0,
  }))
}

export async function fetchCustomerSegmentation(branchId, days = 365) {
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_id, total_amount, created_at')
    .eq('branch_id', branchId)
    .gte('created_at', since)
    .not('customer_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  const segments = calculateRFM(orders || [])
  return {
    segments,
    stats: getSegmentStats(segments),
    totalCustomers: segments.length,
    totalSpent: segments.reduce((s, c) => s + c.totalSpent, 0),
    averageRfm: segments.length > 0
      ? segments.reduce((s, c) => s + c.rfmScore, 0) / segments.length
      : 0,
  }
}

export { RFM_SEGMENTS }
