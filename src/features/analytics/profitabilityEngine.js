import { supabase } from '@/lib/supabase'

export function calculateProductProfitability(items, recipes) {
  const productMap = {}

  items.forEach((item) => {
    const productId = item.product_id || item.id
    if (!productId) return

    if (!productMap[productId]) {
      productMap[productId] = {
        productId,
        name: item.name || item.product_name || 'Producto',
        category: item.category || item.category_name || 'General',
        quantity: 0,
        revenue: 0,
        cost: 0,
      }
    }

    const p = productMap[productId]
    const qty = Number(item.quantity || 1)
    const price = Number(item.unit_price || item.price || 0)
    p.quantity += qty
    p.revenue += qty * price

    const recipe = recipes.find((r) => r.product_id === productId)
    if (recipe) {
      p.cost += qty * Number(recipe.total_cost || recipe.ingredient_cost || 0)
    }
  })

  return Object.values(productMap).map((p) => ({
    ...p,
    cost: p.cost || p.revenue * 0.3,
    profit: p.revenue - (p.cost || p.revenue * 0.3),
    margin: p.revenue > 0
      ? ((p.revenue - (p.cost || p.revenue * 0.3)) / p.revenue) * 100
      : 0,
    averagePrice: p.quantity > 0 ? p.revenue / p.quantity : 0,
  })).sort((a, b) => b.profit - a.profit)
}

export function calculateCategoryProfitability(products) {
  const categoryMap = {}

  products.forEach((p) => {
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { category: p.category, revenue: 0, cost: 0, profit: 0, quantity: 0, products: 0 }
    }
    const c = categoryMap[p.category]
    c.revenue += p.revenue
    c.cost += p.cost || 0
    c.profit += p.profit || 0
    c.quantity += p.quantity
    c.products += 1
  })

  return Object.values(categoryMap).map((c) => ({
    ...c,
    margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
    averagePerProduct: c.products > 0 ? c.revenue / c.products : 0,
  })).sort((a, b) => b.profit - a.profit)
}

export function calculateHourlyProfitability(orders, hours) {
  const hourlyMap = {}
  const hourSlots = hours || Array.from({ length: 24 }, (_, i) => i)

  hourSlots.forEach((h) => {
    hourlyMap[h] = { hour: h, orders: 0, revenue: 0, cost: 0, profit: 0, items: 0 }
  })

  orders.forEach((order) => {
    const orderHour = new Date(order.created_at || order.date).getHours()
    if (!hourlyMap[orderHour]) return

    const h = hourlyMap[orderHour]
    h.orders += 1
    h.revenue += Number(order.total_amount || order.total || 0)
    h.items += (order.items || []).reduce((s, i) => s + Number(i.quantity || 1), 0)
  })

  return Object.values(hourlyMap).map((h) => ({
    ...h,
    cost: h.revenue * 0.3,
    profit: h.revenue * 0.7,
    averageTicket: h.orders > 0 ? h.revenue / h.orders : 0,
  }))
}

export function calculateDayOfWeekProfitability(orders) {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const dayMap = {}

  Array.from({ length: 7 }, (_, i) => {
    dayMap[i] = { day: i, dayName: dayNames[i], orders: 0, revenue: 0, cost: 0, profit: 0 }
  })

  orders.forEach((order) => {
    const day = new Date(order.created_at || order.date).getDay()
    if (!dayMap[day]) return
    const d = dayMap[day]
    d.orders += 1
    d.revenue += Number(order.total_amount || order.total || 0)
  })

  return Object.values(dayMap).map((d) => ({
    ...d,
    cost: d.revenue * 0.3,
    profit: d.revenue * 0.7,
    averageTicket: d.orders > 0 ? d.revenue / d.orders : 0,
  }))
}

export async function fetchProfitabilityData(branchId, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [ordersRes, recipesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_amount, created_at, items:order_items(product_id, quantity, unit_price, name, category:product_categories(name))')
      .eq('branch_id', branchId)
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabase
      .from('product_recipes')
      .select('product_id, total_cost, ingredient_cost'),
  ])

  const orders = ordersRes.data || []
  const recipes = recipesRes.data || []

  const allItems = orders.flatMap((o) => (o.items || []).map((i) => ({
    ...i,
    created_at: o.created_at,
    order_total: o.total_amount,
  })))

  const products = calculateProductProfitability(allItems, recipes)
  const categories = calculateCategoryProfitability(products)
  const hourly = calculateHourlyProfitability(orders)
  const byDay = calculateDayOfWeekProfitability(orders)

  return {
    products: products.slice(0, 50),
    categories,
    hourly,
    byDay,
    totalRevenue: products.reduce((s, p) => s + p.revenue, 0),
    totalCost: products.reduce((s, p) => s + p.cost, 0),
    totalProfit: products.reduce((s, p) => s + p.profit, 0),
    averageMargin: products.length > 0
      ? products.reduce((s, p) => s + p.margin, 0) / products.length
      : 0,
    topProduct: products[0] || null,
    worstProduct: products[products.length - 1] || null,
  }
}
