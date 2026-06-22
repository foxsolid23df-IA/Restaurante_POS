import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

const numberValue = (value) => Number.parseFloat(value || 0) || 0

const toIsoEnd = (date) => `${date}T23:59:59.999Z`

const normalizeFilters = (filters = {}, currentBranch) => ({
  startDate: filters.startDate,
  endDate: filters.endDate || filters.startDate,
  branchId: filters.consolidated ? null : filters.branchId || currentBranch?.id || null,
  consolidated: Boolean(filters.consolidated)
})

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  return []
}

const safeRpc = async (name, params, fallback) => {
  const { data, error } = await supabase.rpc(name, params)

  if (!error) return data

  const missingFunction = error.code === 'PGRST202' || /function .* does not exist/i.test(error.message || '')
  if (missingFunction && fallback) return fallback()

  throw error
}

const paymentSelect = `
  id,
  amount,
  payment_method,
  created_at,
  order_id,
  user_id,
  orders!inner(
    id,
    branch_id,
    created_at,
    status,
    order_items(
      id,
      order_id,
      product_id,
      quantity,
      price_at_order,
      products(id, name, category_id, price, categories(name))
    )
  )
`

const recipeSelect = `
  product_id,
  quantity_required,
  wastage_percentage,
  inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit, branch_id)
`

const fetchPayments = async (filters, currentBranch) => {
  const normalized = normalizeFilters(filters, currentBranch)
  let query = supabase
    .from('payments')
    .select(paymentSelect)
    .gte('created_at', normalized.startDate)
    .lte('created_at', toIsoEnd(normalized.endDate))

  if (normalized.branchId && !normalized.consolidated) {
    query = query.eq('orders.branch_id', normalized.branchId)
  }

  if (filters.userId) query = query.eq('user_id', filters.userId)

  const { data, error } = await query
  if (error) throw error

  return data || []
}

const fetchRecipes = async () => {
  const { data, error } = await supabase.from('product_recipes').select(recipeSelect)
  if (!error) return data || []

  if (!/wastage_percentage/i.test(error.message || '')) throw error

  const { data: retryData, error: retryError } = await supabase
    .from('product_recipes')
    .select('product_id, quantity_required, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit, branch_id)')

  if (retryError) throw retryError
  return retryData || []
}

const buildRecipeCosts = (recipes = []) => {
  return recipes.reduce((acc, recipe) => {
    const productId = recipe.product_id
    if (!productId) return acc

    if (!acc[productId]) {
      acc[productId] = {
        unitCost: 0,
        recipeItems: 0,
        hasMissingCost: false
      }
    }

    const cost = numberValue(recipe.inventory_items?.cost_per_unit)
    const quantity = numberValue(recipe.quantity_required)
    const wastage = numberValue(recipe.wastage_percentage)

    acc[productId].unitCost += quantity * (1 + wastage / 100) * cost
    acc[productId].recipeItems += 1
    if (cost <= 0) acc[productId].hasMissingCost = true

    return acc
  }, {})
}

const uniqueOrderItemsFromPayments = (payments = []) => {
  const orderMap = new Map()

  payments.forEach((payment) => {
    const order = payment.orders
    if (!order?.id || orderMap.has(order.id)) return
    orderMap.set(order.id, order.order_items || [])
  })

  return Array.from(orderMap.values()).flat()
}

const fallbackSalesReport = async (filters, currentBranch) => {
  const [payments, recipes] = await Promise.all([
    fetchPayments(filters, currentBranch),
    fetchRecipes()
  ])
  const recipeCosts = buildRecipeCosts(recipes)
  const orderIds = new Set(payments.map((payment) => payment.order_id).filter(Boolean))
  const orderItems = uniqueOrderItemsFromPayments(payments)

  const costSummary = orderItems.reduce((acc, item) => {
    const costInfo = recipeCosts[item.product_id]
    const quantity = numberValue(item.quantity || 1)

    acc.totalCost += quantity * numberValue(costInfo?.unitCost)
    if (!costInfo?.recipeItems) acc.productsWithoutRecipe.add(item.product_id)
    if (costInfo?.hasMissingCost) acc.productsWithoutCost.add(item.product_id)

    return acc
  }, { totalCost: 0, productsWithoutRecipe: new Set(), productsWithoutCost: new Set() })

  const summary = payments.reduce((acc, payment) => {
    const amount = numberValue(payment.amount)
    const method = payment.payment_method || 'other'

    acc.totalSales += amount
    acc.paymentMethods[method] = (acc.paymentMethods[method] || 0) + amount
    if (method === 'cash') acc.cashSales += amount
    else if (method === 'card') acc.cardSales += amount
    else acc.otherSales += amount

    return acc
  }, { totalSales: 0, cashSales: 0, cardSales: 0, otherSales: 0, paymentMethods: {} })

  return {
    ...summary,
    totalOrders: orderIds.size,
    totalPayments: payments.length,
    averageTicket: orderIds.size > 0 ? summary.totalSales / orderIds.size : 0,
    totalCost: costSummary.totalCost,
    grossProfit: summary.totalSales - costSummary.totalCost,
    grossMargin: summary.totalSales > 0 ? ((summary.totalSales - costSummary.totalCost) / summary.totalSales) * 100 : 0,
    productsWithoutRecipe: costSummary.productsWithoutRecipe.size,
    productsWithoutCost: costSummary.productsWithoutCost.size,
    source: 'payments'
  }
}

const fallbackProductPerformance = async (filters, currentBranch) => {
  const [payments, recipes] = await Promise.all([
    fetchPayments(filters, currentBranch),
    fetchRecipes()
  ])
  const recipeCosts = buildRecipeCosts(recipes)
  const products = {}

  uniqueOrderItemsFromPayments(payments).forEach((item) => {
    const product = item.products
    if (!product?.id) return

    const quantity = numberValue(item.quantity || 1)
    const revenue = numberValue(item.price_at_order || product.price) * quantity
    const costInfo = recipeCosts[product.id]
    const totalCost = quantity * numberValue(costInfo?.unitCost)

    if (!products[product.id]) {
      products[product.id] = {
        id: product.id,
        name: product.name || 'Producto sin nombre',
        category: product.categories?.name || 'Sin categoria',
        quantity: 0,
        revenue: 0,
        totalCost: 0,
        orderIds: new Set(),
        unitCost: numberValue(costInfo?.unitCost),
        recipeItems: numberValue(costInfo?.recipeItems),
        hasMissingCost: Boolean(costInfo?.hasMissingCost)
      }
    }

    products[product.id].quantity += quantity
    products[product.id].revenue += revenue
    products[product.id].totalCost += totalCost
    if (item.order_id) products[product.id].orderIds.add(item.order_id)
  })

  return Object.values(products)
    .map((product) => {
      const profit = product.revenue - product.totalCost
      return {
        ...product,
        avgPrice: product.quantity > 0 ? product.revenue / product.quantity : 0,
        orderCount: product.orderIds?.size || 0,
        avgPerOrder: product.orderIds?.size ? product.quantity / product.orderIds.size : 0,
        profit,
        profitMargin: product.revenue > 0 ? (profit / product.revenue) * 100 : 0,
        profitability: product.revenue > 0 ? (profit / product.revenue) * 100 : 0,
        hasRecipe: product.recipeItems > 0,
        requiresConfiguration: product.recipeItems <= 0 || product.hasMissingCost
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

const fallbackHourlySales = async (filters, currentBranch) => {
  const payments = await fetchPayments(filters, currentBranch)
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sales: 0,
    orders: 0,
    avgTicket: 0,
    peak: false
  }))

  payments.forEach((payment) => {
    const hour = new Date(payment.created_at).getHours()
    if (hour < 0 || hour > 23) return
    hourlyData[hour].sales += numberValue(payment.amount)
    hourlyData[hour].orders += 1
  })

  const activeHours = hourlyData.filter((hour) => hour.sales > 0)
  const avgSales = activeHours.length > 0
    ? activeHours.reduce((sum, hour) => sum + hour.sales, 0) / activeHours.length
    : 0

  return hourlyData.map((hour) => ({
    ...hour,
    avgTicket: hour.orders > 0 ? hour.sales / hour.orders : 0,
    peak: avgSales > 0 && hour.sales > avgSales * 1.5
  }))
}

const fallbackIngredientForecast = async ({ daysToPredict = 7, historicalDays = 30, currentBranch }) => {
  const historicalStart = new Date(Date.now() - historicalDays * 24 * 60 * 60 * 1000).toISOString()

  let salesQuery = supabase
    .from('order_items')
    .select('product_id, quantity, created_at, orders!inner(branch_id, status)')
    .gte('created_at', historicalStart)
    .eq('orders.status', 'completed')

  if (currentBranch?.id) salesQuery = salesQuery.eq('orders.branch_id', currentBranch.id)

  const [{ data: historicalSales, error: salesError }, recipes] = await Promise.all([
    salesQuery,
    fetchRecipes()
  ])
  if (salesError) throw salesError

  const productConsumption = (historicalSales || []).reduce((acc, sale) => {
    acc[sale.product_id] = (acc[sale.product_id] || 0) + numberValue(sale.quantity || 1)
    return acc
  }, {})

  const ingredientNeeds = recipes.reduce((acc, recipe) => {
    const ingredient = recipe.inventory_items
    if (!ingredient) return acc
    if (currentBranch?.id && ingredient.branch_id && ingredient.branch_id !== currentBranch.id) return acc

    if (!acc[ingredient.id]) {
      acc[ingredient.id] = {
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        currentStock: numberValue(ingredient.current_stock),
        minStock: numberValue(ingredient.min_stock),
        costPerUnit: numberValue(ingredient.cost_per_unit),
        dailyRequirement: 0
      }
    }

    const wastage = numberValue(recipe.wastage_percentage)
    acc[ingredient.id].dailyRequirement += numberValue(recipe.quantity_required)
      * (1 + wastage / 100)
      * ((productConsumption[recipe.product_id] || 0) / Math.max(1, historicalDays))

    return acc
  }, {})

  const items = Object.values(ingredientNeeds).map((item) => {
    const neededNextWeek = item.dailyRequirement * daysToPredict
    const toBuy = Math.max(0, neededNextWeek + item.minStock - item.currentStock)

    return {
      ...item,
      neededNextWeek,
      toBuy,
      estimatedCost: toBuy * item.costPerUnit,
      isUrgent: item.currentStock < item.minStock
    }
  }).sort((a, b) => b.estimatedCost - a.estimatedCost)

  return {
    items,
    totalEstimatedCost: items.reduce((sum, item) => sum + item.estimatedCost, 0),
    urgentCount: items.filter((item) => item.isUrgent).length
  }
}

export const reportsApi = {
  async getSalesReport(filters = {}, currentBranch) {
    const normalized = normalizeFilters(filters, currentBranch)
    return safeRpc('get_sales_report', {
      p_start_date: normalized.startDate,
      p_end_date: normalized.endDate,
      p_branch_id: normalized.branchId,
      p_consolidated: normalized.consolidated
    }, () => fallbackSalesReport(filters, currentBranch))
  },

  async getProductPerformance(filters = {}, currentBranch) {
    const normalized = normalizeFilters(filters, currentBranch)
    const data = await safeRpc('get_product_performance', {
      p_start_date: normalized.startDate,
      p_end_date: normalized.endDate,
      p_branch_id: normalized.branchId,
      p_consolidated: normalized.consolidated
    }, () => fallbackProductPerformance(filters, currentBranch))
    return asArray(data)
  },

  async getHourlySales(filters = {}, currentBranch) {
    const normalized = normalizeFilters(filters, currentBranch)
    const data = await safeRpc('get_hourly_sales', {
      p_start_date: normalized.startDate,
      p_end_date: normalized.endDate,
      p_branch_id: normalized.branchId,
      p_consolidated: normalized.consolidated
    }, () => fallbackHourlySales(filters, currentBranch))
    return asArray(data)
  },

  async getIngredientForecast({ daysToPredict = 7, historicalDays = 30 } = {}, currentBranch) {
    return safeRpc('get_ingredient_forecast', {
      p_days_to_predict: daysToPredict,
      p_historical_days: historicalDays,
      p_branch_id: currentBranch?.id || null
    }, () => fallbackIngredientForecast({ daysToPredict, historicalDays, currentBranch }))
  },

  async getInventoryAnalysis(filters = {}, currentBranch) {
    let query = supabase
      .from('inventory_items')
      .select('id, name, unit, current_stock, min_stock, cost_per_unit, branch_id')
      .order('name', { ascending: true })

    if (currentBranch?.id && !filters.consolidated) {
      query = query.eq('branch_id', currentBranch.id)
    }

    const { data, error } = await query
    if (error) throw error

    const items = (data || []).map((item) => {
      const stock = numberValue(item.current_stock)
      const minStock = numberValue(item.min_stock)
      const cost = numberValue(item.cost_per_unit)

      return {
        ...item,
        stock,
        min_stock: minStock,
        totalValue: stock * cost,
        totalCost: stock * cost,
        stockout: stock <= minStock
      }
    })

    return {
      products: items,
      lowStock: items.filter((item) => item.stockout),
      fastMoving: [],
      slowMoving: [],
      totalInventoryValue: items.reduce((sum, item) => sum + item.totalValue, 0),
      totalInventoryCost: items.reduce((sum, item) => sum + item.totalCost, 0)
    }
  },

  exportToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
    XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
  }
}

export { numberValue }
