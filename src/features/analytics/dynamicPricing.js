import { supabase } from '@/lib/supabase'

export function calculatePriceElasticity(priceChanges, quantityChanges) {
  if (priceChanges.length < 2 || quantityChanges.length < 2) return null

  const n = Math.min(priceChanges.length, quantityChanges.length)
  let sumP = 0, sumQ = 0, sumPQ = 0, sumP2 = 0

  for (let i = 0; i < n; i++) {
    const pChange = priceChanges[i]
    const qChange = quantityChanges[i]
    sumP += pChange
    sumQ += qChange
    sumPQ += pChange * qChange
    sumP2 += pChange * pChange
  }

  const slope = (n * sumPQ - sumP * sumQ) / (n * sumP2 - sumP * sumP) || 0
  return { elasticity: slope, interpretación: slope < 0 ? 'Elástico' : 'Inelástico' }
}

export function suggestOptimalPrice(currentPrice, elasticity, cost, maxPrice = currentPrice * 1.5) {
  if (!elasticity) return null

  const targetMargin = 0.4
  const costBasedPrice = cost / (1 - targetMargin)
  const elasticAdjustment = elasticity < -1
    ? currentPrice * 0.95
    : currentPrice * 1.05

  const suggested = (costBasedPrice + elasticAdjustment) / 2
  const final = Math.max(cost * 1.1, Math.min(maxPrice, Math.round(suggested * 100) / 100))

  return {
    currentPrice,
    suggestedPrice: final,
    cost,
    margin: final > 0 ? ((final - cost) / final) * 100 : 0,
    change: ((final - currentPrice) / currentPrice) * 100,
    reason: final < currentPrice
      ? 'Reducción sugerida por elasticidad alta'
      : 'Incremento sugerido por demanda inelástica',
  }
}

export function generateTimeBasedPricing(basePrice, hour, dayOfWeek) {
  const multipliers = {
    weekday: { morning: 0.9, lunch: 1.15, afternoon: 0.95, dinner: 1.2, night: 0.85 },
    weekend: { morning: 1.0, lunch: 1.1, afternoon: 1.0, dinner: 1.25, night: 0.9 },
  }

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const schedule = isWeekend ? multipliers.weekend : multipliers.weekday

  let period
  if (hour < 11) period = 'morning'
  else if (hour < 15) period = 'lunch'
  else if (hour < 18) period = 'afternoon'
  else if (hour < 22) period = 'dinner'
  else period = 'night'

  const multiplier = schedule[period] || 1.0
  return {
    period,
    multiplier,
    price: Math.round(basePrice * multiplier * 100) / 100,
    label: period === 'morning' ? 'Desayuno' : period === 'lunch' ? 'Comida' : period === 'afternoon' ? 'Post-comida' : period === 'dinner' ? 'Cena' : 'Noche',
  }
}

export function getDemandLevel(historicalSales, currentSales) {
  if (!historicalSales || historicalSales.length === 0) return 'medium'

  const avg = historicalSales.reduce((s, v) => s + v, 0) / historicalSales.length
  const std = Math.sqrt(historicalSales.reduce((s, v) => s + (v - avg) ** 2, 0) / historicalSales.length)

  if (currentSales > avg + std) return 'high'
  if (currentSales < avg - std) return 'low'
  return 'medium'
}

export async function fetchDynamicPricingSuggestions(branchId, productId) {
  const { data: orders, error } = await supabase
    .from('order_items')
    .select('unit_price, quantity, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const { data: product } = await supabase
    .from('products')
    .select('id, name, price, cost')
    .eq('id', productId)
    .single()

  if (!product) return null

  const prices = (orders || []).map((o) => Number(o.unit_price))
  const quantities = (orders || []).map((o) => Number(o.quantity || 1))
  const avgPrice = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : product.price

  const priceChanges = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i])
  const quantityChanges = quantities.slice(1).map((q, i) => (q - quantities[i]) / Math.max(quantities[i], 1))

  const elasticity = calculatePriceElasticity(priceChanges, quantityChanges)

  const suggestions = []
  suggestions.push(suggestOptimalPrice(
    Number(product.price),
    elasticity?.elasticity || -1.2,
    Number(product.cost || product.price * 0.3),
  ))

  const now = new Date()
  const timeBased = generateTimeBasedPricing(Number(product.price), now.getHours(), now.getDay())
  suggestions.push(timeBased)

  return {
    productId: product.id,
    productName: product.name,
    currentPrice: Number(product.price),
    cost: Number(product.cost || product.price * 0.3),
    elasticity: elasticity?.elasticity || null,
    suggestions,
    demandLevel: getDemandLevel(quantities, quantities[0] || 0),
    lastSold: orders?.[0]?.created_at || null,
  }
}
