export function movingAverage(data, windowSize = 7) {
  if (!data || data.length === 0) return []
  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const slice = data.slice(start, i + 1)
    const avg = slice.reduce((s, v) => s + v, 0) / slice.length
    result.push(avg)
  }
  return result
}

export function exponentialSmoothing(data, alpha = 0.3) {
  if (!data || data.length === 0) return []
  const result = [data[0]]
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

export function linearRegression(data) {
  if (!data || data.length < 2) return { slope: 0, intercept: 0, predict: () => 0 }

  const n = data.length
  const xMean = (n - 1) / 2
  const yMean = data.reduce((s, v) => s + v, 0) / n

  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean
    const yDiff = data[i] - yMean
    num += xDiff * yDiff
    den += xDiff * xDiff
  }

  const slope = den !== 0 ? num / den : 0
  const intercept = yMean - slope * xMean

  return {
    slope,
    intercept,
    predict: (x) => intercept + slope * x,
  }
}

export function predictNextPeriods(historicalData, periods = 7, method = 'linear') {
  if (!historicalData || historicalData.length === 0) {
    return Array(periods).fill(0)
  }

  const values = historicalData.map((d) => (typeof d === 'number' ? d : d.value || 0))

  if (method === 'linear') {
    const regression = linearRegression(values)
    const predictions = []
    const n = values.length

    for (let i = 0; i < periods; i++) {
      const prediction = Math.max(0, regression.predict(n + i))
      predictions.push({ period: i + 1, predicted: prediction, lower: prediction * 0.85, upper: prediction * 1.15 })
    }
    return predictions
  }

  if (method === 'moving_avg') {
    const smoothed = movingAverage(values, 3)
    const lastAvg = smoothed[smoothed.length - 1] || 0
    const trend = values.length >= 7
      ? (values[values.length - 1] - values[values.length - 7]) / 7
      : 0
    const predictions = []
    for (let i = 0; i < periods; i++) {
      const prediction = Math.max(0, lastAvg + trend * (i + 1))
      predictions.push({ period: i + 1, predicted: prediction, lower: prediction * 0.8, upper: prediction * 1.2 })
    }
    return predictions
  }

  return Array(periods).fill({ period: 0, predicted: 0, lower: 0, upper: 0 })
}

export function detectAnomalies(data, threshold = 2) {
  if (!data || data.length < 4) return []

  const values = data.map((d) => (typeof d === 'number' ? d : d.value || 0))
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)

  const anomalies = []
  for (let i = 0; i < values.length; i++) {
    const zScore = Math.abs((values[i] - mean) / (stdDev || 1))
    if (zScore > threshold) {
      anomalies.push({ index: i, value: values[i], zScore, expected: mean })
    }
  }
  return anomalies
}

export function getTopProducts(orders, metric = 'quantity', limit = 10) {
  const productMap = {}

  orders.forEach((order) => {
    (order.items || order.order_items || []).forEach((item) => {
      const id = item.product_id || item.id
      if (!id) return

      if (!productMap[id]) {
        productMap[id] = {
          id,
          name: item.name || item.products?.name || `Producto ${id}`,
          quantity: 0,
          revenue: 0,
          orders: 0,
        }
      }

      productMap[id].quantity += item.quantity || 1
      productMap[id].revenue += (item.price_at_order || item.price || 0) * (item.quantity || 1)
      productMap[id].orders += 1
    })
  })

  const products = Object.values(productMap)
  const sorted = products.sort((a, b) => b[metric] - a[metric])
  return sorted.slice(0, limit)
}

export function getBusiestHours(orders) {
  const hourMap = {}
  for (let h = 0; h < 24; h++) hourMap[h] = { hour: h, orders: 0, revenue: 0, count: 0 }

  orders.forEach((order) => {
    if (!order.created_at) return
    const hour = new Date(order.created_at).getHours()
    if (hourMap[hour]) {
      hourMap[hour].orders += 1
      hourMap[hour].revenue += order.total_amount || 0
      hourMap[hour].count = (hourMap[hour].count || 0) + 1
    }
  })

  return Object.values(hourMap).sort((a, b) => a.hour - b.hour)
}

export function getRecommendations(customerHistory, allProducts) {
  if (!customerHistory || customerHistory.length === 0 || !allProducts) {
    return allProducts?.slice(0, 5) || []
  }

  const categoryCount = {}
  const purchasedIds = new Set()

  customerHistory.forEach((order) => {
    (order.items || order.order_items || []).forEach((item) => {
      const productId = item.product_id || item.id
      const categoryId = item.products?.category_id || item.category_id
      if (productId) purchasedIds.add(productId)
      if (categoryId) {
        categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1
      }
    })
  })

  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  const recommendations = allProducts
    .filter((p) => !purchasedIds.has(p.id) && (topCategory ? p.category_id === topCategory : true))
    .sort((a, b) => (b.popularity || b.sales_count || 0) - (a.popularity || a.sales_count || 0))
    .slice(0, 5)

  return recommendations
}

export function calculateDayOverDay(current, previous) {
  const diff = current - previous
  const pct = previous !== 0 ? (diff / previous) * 100 : 0
  return { diff, percentage: Math.round(pct * 100) / 100 }
}

export function segmentCustomers(orders) {
  const customerMap = {}

  orders.forEach((order) => {
    const id = order.customer_id || order.user_id
    if (!id) return
    if (!customerMap[id]) {
      customerMap[id] = { id, totalSpent: 0, orderCount: 0, lastOrder: null, firstOrder: null }
    }
    customerMap[id].totalSpent += order.total_amount || 0
    customerMap[id].orderCount += 1
    const createdAt = order.created_at || order.createdAt
    if (createdAt) {
      if (!customerMap[id].firstOrder || createdAt < customerMap[id].firstOrder) {
        customerMap[id].firstOrder = createdAt
      }
      if (!customerMap[id].lastOrder || createdAt > customerMap[id].lastOrder) {
        customerMap[id].lastOrder = createdAt
      }
    }
  })

  const segments = { vip: [], frequent: [], regular: [], at_risk: [], new: [] }

  Object.values(customerMap).forEach((c) => {
    if (c.totalSpent > 5000 || c.orderCount > 20) {
      segments.vip.push(c)
    } else if (c.orderCount > 10) {
      segments.frequent.push(c)
    } else if (c.orderCount > 3) {
      segments.regular.push(c)
    } else if (c.lastOrder && Date.now() - new Date(c.lastOrder).getTime() > 90 * 24 * 60 * 60 * 1000) {
      segments.at_risk.push(c)
    } else {
      segments.new.push(c)
    }
  })

  return segments
}
