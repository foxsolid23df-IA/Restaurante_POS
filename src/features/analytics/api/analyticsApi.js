import { supabase } from '@/lib/supabase'
import { predictNextPeriods, detectAnomalies, getTopProducts, getBusiestHours, getRecommendations, segmentCustomers, calculateDayOverDay } from '../forecastEngine'

export const analyticsApi = {
  async getSalesForecast(branchId, daysToPredict = 14, historicalDays = 60) {
    const now = new Date()
    const from = new Date(now.getTime() - historicalDays * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', from)
      .eq('status', 'completed')
      .order('created_at')

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error } = await query
    if (error) throw error

    const dailyTotals = aggregateDailyTotals(data || [])
    const predictions = predictNextPeriods(dailyTotals.map((d) => d.total), daysToPredict)

    return {
      historical: dailyTotals,
      predictions,
      totalHistorical: dailyTotals.reduce((s, d) => s + d.total, 0),
      averageDaily: dailyTotals.length > 0
        ? dailyTotals.reduce((s, d) => s + d.total, 0) / dailyTotals.length
        : 0,
    }
  },

  async getProductRecommendations(branchId, customerId) {
    const [allProducts, customerOrders] = await Promise.all([
      supabase.from('products').select('id, name, price, category_id, image_url').eq('is_active', true),
      customerId
        ? supabase.from('orders').select('*, order_items(*, products(category_id))').eq('customer_id', customerId).limit(50)
        : Promise.resolve({ data: [] }),
    ])

    if (allProducts.error) throw allProducts.error
    const recommendations = getRecommendations(customerOrders.data || [], allProducts.data || [])
    return recommendations
  },

  async getAnomalyDetection(branchId, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    let query = supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', from)
      .order('created_at')

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error } = await query
    if (error) throw error

    const dailyTotals = aggregateDailyTotals(data || [])
    const anomalies = detectAnomalies(dailyTotals.map((d) => d.total))
    return { dailyTotals, anomalies }
  },

  async getCustomerSegmentation(branchId) {
    let query = supabase
      .from('orders')
      .select('customer_id, user_id, total_amount, created_at, status')
      .eq('status', 'completed')

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error } = await query
    if (error) throw error

    const segments = segmentCustomers(data || [])
    return segments
  },

  async getTopProducts(branchId, metric = 'quantity', limit = 10, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(name))')
      .gte('created_at', from)
      .eq('status', 'completed')

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error } = await query
    if (error) throw error

    return getTopProducts(data || [], metric, limit)
  },

  async getBusiestHours(branchId, days = 30) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', from)

    if (branchId) query = query.eq('branch_id', branchId)

    const { data, error } = await query
    if (error) throw error

    return getBusiestHours(data || [])
  },

  async getDayOverDayComparison(branchId) {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    async function getDayTotal(dateStr) {
      let query = supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', `${dateStr}T00:00:00.000Z`)
        .lte('created_at', `${dateStr}T23:59:59.999Z`)
        .eq('status', 'completed')

      if (branchId) query = query.eq('branch_id', branchId)

      const { data } = await query
      return (data || []).reduce((s, o) => s + (o.total_amount || 0), 0)
    }

    const [todayTotal, yesterdayTotal] = await Promise.all([getDayTotal(todayStr), getDayTotal(yesterdayStr)])
    return { today: todayTotal, yesterday: yesterdayTotal, ...calculateDayOverDay(todayTotal, yesterdayTotal) }
  },
}

function aggregateDailyTotals(orders) {
  const dayMap = {}
  orders.forEach((o) => {
    const day = o.created_at?.split('T')[0]
    if (!day) return
    dayMap[day] = (dayMap[day] || 0) + (o.total_amount || 0)
  })

  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }))
}

export default analyticsApi
