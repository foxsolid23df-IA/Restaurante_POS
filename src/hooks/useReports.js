import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranchStore } from '@/store/branchStore'

const numberValue = (value) => Number.parseFloat(value || 0) || 0

const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(numberValue(amount))

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const withDateFilters = (query, filters = {}) => {
  let nextQuery = query

  if (filters.startDate) {
    nextQuery = nextQuery.gte('created_at', filters.startDate)
  }

  if (filters.endDate) {
    nextQuery = nextQuery.lte('created_at', `${filters.endDate}T23:59:59.999Z`)
  }

  if (filters.date) {
    const dateStr = filters.date
    if (!dateStr || isNaN(new Date(dateStr).getTime())) {
      throw new Error('Fecha invalida')
    }
    const start = new Date(`${dateStr}T00:00:00.000Z`)
    const end = new Date(`${dateStr}T23:59:59.999Z`)
    nextQuery = nextQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  }

  return nextQuery
}

const percentChange = (current, previous) => {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export function useReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const fetchReportData = async (table, select = '*', filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      if (table === 'payments') {
        const paymentSelect = select.includes('orders') ? select : `${select}, orders!inner(branch_id)`
        let query = supabase.from('payments').select(paymentSelect)

        if (currentBranch?.id && !filters.consolidated) {
          query = query.eq('orders.branch_id', currentBranch.id)
        }
        if (filters.userId) {
          query = query.eq('user_id', filters.userId)
        }

        const { data, error: queryError } = await withDateFilters(query, filters)
        return { data: data || [], error: queryError }
      }

      let query = supabase.from(table).select(select)

      if (currentBranch?.id && !filters.consolidated && !['products', 'categories', 'profiles'].includes(table)) {
        query = query.eq('branch_id', currentBranch.id)
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.productId) {
        query = query.eq('product_id', filters.productId)
      }

      const { data, error: queryError } = await withDateFilters(query, filters)
      return { data: data || [], error: queryError }
    } catch (err) {
      setError(err.message)
      return { data: [], error: err }
    } finally {
      setLoading(false)
    }
  }

  const getDailySales = async (filters = {}) => {
    if (typeof filters === 'string') filters = { date: filters }

    const { data, error: reportError } = await fetchReportData(
      'payments',
      `id, amount, payment_method, created_at, order_id,
       orders!inner(id, created_at, branch_id, tables(name))`,
      filters
    )

    if (reportError) throw reportError

    const orderIds = new Set(data.map((payment) => payment.order_id || payment.orders?.id).filter(Boolean))

    return {
      totalSales: data.reduce((sum, payment) => sum + numberValue(payment.amount), 0),
      cashSales: data.filter((payment) => payment.payment_method === 'cash').reduce((sum, payment) => sum + numberValue(payment.amount), 0),
      cardSales: data.filter((payment) => payment.payment_method === 'card').reduce((sum, payment) => sum + numberValue(payment.amount), 0),
      otherSales: data.filter((payment) => !['cash', 'card'].includes(payment.payment_method)).reduce((sum, payment) => sum + numberValue(payment.amount), 0),
      totalOrders: orderIds.size,
      paymentMethods: data.reduce((acc, payment) => {
        const method = payment.payment_method || 'other'
        acc[method] = (acc[method] || 0) + numberValue(payment.amount)
        return acc
      }, {})
    }
  }

  const getSalesComparison = async (currentPeriod, previousPeriod) => {
    const [current, previous] = await Promise.all([
      getDailySales(currentPeriod),
      getDailySales(previousPeriod)
    ])

    const currentAvgTicket = current.totalOrders > 0 ? current.totalSales / current.totalOrders : 0
    const previousAvgTicket = previous.totalOrders > 0 ? previous.totalSales / previous.totalOrders : 0

    return {
      current: {
        sales: current.totalSales,
        orders: current.totalOrders,
        avgTicket: currentAvgTicket
      },
      previous: {
        sales: previous.totalSales,
        orders: previous.totalOrders,
        avgTicket: previousAvgTicket
      },
      variance: {
        sales: percentChange(current.totalSales, previous.totalSales),
        orders: percentChange(current.totalOrders, previous.totalOrders),
        avgTicket: percentChange(currentAvgTicket, previousAvgTicket)
      }
    }
  }

  const getProductAnalysis = async (filters = {}) => {
    const { data: sales, error: reportError } = await fetchReportData(
      'payments',
      `id, amount, order_id,
       orders!inner(branch_id, order_items!inner(
         quantity,
         price_at_order,
         product_id,
         products!inner(name, category_id)
       ))`,
      filters
    )

    if (reportError) throw reportError

    const productMetrics = {}

    sales.forEach((sale) => {
      sale.orders?.order_items?.forEach((item) => {
        const productKey = item.products?.name || 'Producto sin nombre'

        if (!productMetrics[productKey]) {
          productMetrics[productKey] = {
            name: productKey,
            quantity: 0,
            revenue: 0,
            avgPrice: 0,
            orders: new Set(),
            category: item.products?.category_id
          }
        }

        productMetrics[productKey].quantity += item.quantity || 1
        productMetrics[productKey].revenue += numberValue(item.price_at_order) * (item.quantity || 1)
        productMetrics[productKey].orders.add(sale.order_id)
      })
    })

    return Object.values(productMetrics)
      .map((product) => ({
        ...product,
        avgPrice: product.quantity > 0 ? product.revenue / product.quantity : 0,
        orderCount: product.orders.size,
        avgPerOrder: product.orders.size > 0 ? product.quantity / product.orders.size : 0,
        profitability: product.revenue > 0 ? 0.7 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  const getTopProducts = async (metric = 'revenue', limit = 10, filters = {}) => {
    const products = await getProductAnalysis(filters)
    return products.sort((a, b) => (b[metric] || 0) - (a[metric] || 0)).slice(0, limit)
  }

  const getHourlyAnalysis = async (filters = {}) => {
    if (typeof filters === 'string') filters = { date: filters }

    const { data: sales, error: reportError } = await fetchReportData(
      'payments',
      'amount, created_at',
      filters
    )

    if (reportError) throw reportError

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      orders: 0,
      avgTicket: 0,
      peak: false
    }))

    sales.forEach((sale) => {
      const hour = new Date(sale.created_at).getHours()
      if (hour >= 0 && hour < 24) {
        hourlyData[hour].sales += numberValue(sale.amount)
        hourlyData[hour].orders += 1
      }
    })

    const activeHours = hourlyData.filter((hour) => hour.sales > 0)
    const avgSales = activeHours.length > 0
      ? activeHours.reduce((sum, hour) => sum + hour.sales, 0) / activeHours.length
      : 0

    hourlyData.forEach((hour) => {
      hour.avgTicket = hour.orders > 0 ? hour.sales / hour.orders : 0
      hour.peak = avgSales > 0 && hour.sales > avgSales * 1.5
    })

    return hourlyData
  }

  const getFinancialKPIs = async (period = 'month') => {
    const endDate = new Date()
    const startDate = new Date()

    if (period === 'week') startDate.setDate(endDate.getDate() - 7)
    if (period === 'month') startDate.setMonth(endDate.getMonth() - 1)
    if (period === 'year') startDate.setFullYear(endDate.getFullYear() - 1)

    const summary = await getDailySales({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })

    const estimatedCosts = summary.totalSales * 0.7
    const grossProfit = summary.totalSales - estimatedCosts
    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))

    return {
      period,
      revenue: summary.totalSales,
      estimatedCosts,
      grossProfit,
      profitMargin: summary.totalSales > 0 ? (grossProfit / summary.totalSales) * 100 : 0,
      breakEvenPoint: grossProfit > 0 ? (estimatedCosts / grossProfit) * days : 0,
      avgDailyRevenue: summary.totalSales / days,
      efficiency: summary.totalOrders > 0 ? summary.totalSales / summary.totalOrders : 0
    }
  }

  const getInventoryAnalysis = async (filters = {}) => {
    const { data: products, error: productError } = await fetchReportData(
      'products',
      `id, name, category_id, price, cost, stock, min_stock, created_at,
       categories(name)`,
      filters
    )
    if (productError) throw productError

    const productAnalysis = await getProductAnalysis(filters)
    const revenueByName = new Map(productAnalysis.map((product) => [product.name, product]))

    const inventoryMetrics = products.map((product) => {
      const sold = revenueByName.get(product.name)
      const stock = numberValue(product.stock)
      const minStock = numberValue(product.min_stock)
      const cost = numberValue(product.cost)
      const price = numberValue(product.price)

      return {
        ...product,
        totalSold: sold?.quantity || 0,
        totalRevenue: sold?.revenue || 0,
        turnoverRate: stock > 0 ? ((sold?.quantity || 0) / stock) * 100 : 0,
        daysOfInventory: sold?.quantity ? (stock / sold.quantity) * 30 : 999,
        totalValue: stock * price,
        totalCost: stock * cost,
        profitMargin: price > 0 ? ((price - cost) / price) * 100 : 0,
        stockout: stock <= minStock,
        category: product.categories?.name || 'Sin categoria'
      }
    })

    return {
      products: inventoryMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue),
      lowStock: inventoryMetrics.filter((product) => product.stockout),
      fastMoving: inventoryMetrics.filter((product) => product.turnoverRate > 80),
      slowMoving: inventoryMetrics.filter((product) => product.turnoverRate < 20),
      totalInventoryValue: inventoryMetrics.reduce((sum, product) => sum + product.totalValue, 0),
      totalInventoryCost: inventoryMetrics.reduce((sum, product) => sum + product.totalCost, 0)
    }
  }

  const getStaffPerformance = async (filters = {}) => {
    const { data: sales, error: reportError } = await fetchReportData(
      'payments',
      `id, amount, payment_method, created_at, user_id, order_id,
       orders!inner(branch_id, total_amount, created_at, order_items(quantity, price_at_order))`,
      filters
    )
    if (reportError) throw reportError

    const { data: users, error: userError } = await fetchReportData('profiles', 'id, full_name, role, created_at', {})
    if (userError) throw userError

    const staffMetrics = {}

    sales.forEach((sale) => {
      const user = users.find((profile) => profile.id === sale.user_id)
      if (!user) return

      const userName = user.full_name || 'Usuario sin nombre'
      if (!staffMetrics[userName]) {
        staffMetrics[userName] = {
          name: userName,
          role: user.role,
          totalSales: 0,
          totalOrders: new Set(),
          avgTicket: 0,
          totalItems: 0,
          cashTransactions: 0,
          cardTransactions: 0
        }
      }

      const staff = staffMetrics[userName]
      staff.totalSales += numberValue(sale.amount)
      staff.totalOrders.add(sale.order_id)
      if (sale.payment_method === 'cash') staff.cashTransactions += 1
      if (sale.payment_method === 'card') staff.cardTransactions += 1

      sale.orders?.order_items?.forEach((item) => {
        staff.totalItems += item.quantity || 1
      })
    })

    return Object.values(staffMetrics)
      .map((staff) => ({
        ...staff,
        orderCount: staff.totalOrders.size,
        avgTicket: staff.totalOrders.size > 0 ? staff.totalSales / staff.totalOrders.size : 0,
        avgItemsPerOrder: staff.totalOrders.size > 0 ? staff.totalItems / staff.totalOrders.size : 0,
        efficiency: staff.totalOrders.size > 0 ? staff.totalSales / staff.totalOrders.size : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
  }

  const getCustomerAnalysis = async (filters = {}) => {
    const { data: orders, error: reportError } = await fetchReportData(
      'orders',
      `id, total_amount, created_at, table_id, status, customer_info,
       tables(name),
       order_items(quantity, price_at_order, product_id)`,
      filters
    )
    if (reportError) throw reportError

    const customerMetrics = {}

    orders.forEach((order) => {
      const customerId = order.customer_info?.id || `table_${order.table_id || 'unknown'}_${new Date(order.created_at).toDateString()}`
      const isWalkIn = !order.customer_info?.id

      if (!customerMetrics[customerId]) {
        customerMetrics[customerId] = {
          customerId,
          name: order.customer_info?.name || `Mesa ${order.tables?.name || 'Desconocida'}`,
          type: isWalkIn ? 'walk_in' : 'regular',
          totalOrders: 0,
          totalSpent: 0,
          favoriteItems: {},
          firstVisit: order.created_at,
          lastVisit: order.created_at,
          totalItems: 0
        }
      }

      const customer = customerMetrics[customerId]
      customer.totalOrders += 1
      customer.totalSpent += numberValue(order.total_amount)
      customer.lastVisit = new Date(order.created_at) > new Date(customer.lastVisit) ? order.created_at : customer.lastVisit
      order.order_items?.forEach((item) => {
        customer.favoriteItems[item.product_id] = (customer.favoriteItems[item.product_id] || 0) + (item.quantity || 1)
        customer.totalItems += item.quantity || 1
      })
    })

    return Object.values(customerMetrics)
      .map((customer) => ({
        ...customer,
        avgOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
        topFavoriteItem: Object.keys(customer.favoriteItems).length > 0
          ? Object.entries(customer.favoriteItems).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
          : null,
        customerValue: customer.totalSpent * (customer.type === 'regular' ? 1.2 : 1)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
  }

  const getAdvancedFinancials = async (filters = {}) => {
    const { data: payments, error: reportError } = await fetchReportData(
      'payments',
      `amount, payment_method, created_at,
       orders!inner(branch_id, total_amount, order_items(quantity, price_at_order, product_id))`,
      filters
    )
    if (reportError) throw reportError

    const paymentMethodAnalysis = payments.reduce((acc, payment) => {
      const method = payment.payment_method || 'other'
      if (!acc[method]) acc[method] = { count: 0, total: 0, avgAmount: 0 }
      acc[method].count += 1
      acc[method].total += numberValue(payment.amount)
      return acc
    }, {})

    Object.keys(paymentMethodAnalysis).forEach((method) => {
      paymentMethodAnalysis[method].avgAmount = paymentMethodAnalysis[method].count > 0
        ? paymentMethodAnalysis[method].total / paymentMethodAnalysis[method].count
        : 0
    })

    const cashFlow = payments.reduce((acc, payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = { inflow: 0, outflow: 0, net: 0 }
      acc[date].inflow += numberValue(payment.amount)
      acc[date].net = acc[date].inflow - acc[date].outflow
      return acc
    }, {})

    const totalRevenue = payments.reduce((sum, payment) => sum + numberValue(payment.amount), 0)

    return {
      totalRevenue,
      totalTransactions: payments.length,
      avgTransactionSize: payments.length > 0 ? totalRevenue / payments.length : 0,
      paymentMethodAnalysis,
      cashFlow: Object.entries(cashFlow).map(([date, data]) => ({ date, ...data })),
      revenueGrowth: 0,
      profitMargin: 0,
      breakEvenAnalysis: {
        currentRevenue: totalRevenue,
        breakEvenPoint: totalRevenue * 0.8
      }
    }
  }

  const getCostVsSales = async (filters = {}) => {
    const { data: sales, error: salesError } = await fetchReportData(
      'payments',
      `amount, created_at, order_id,
       orders!inner(branch_id, order_items(product_id, quantity, price_at_order))`,
      filters
    )
    if (salesError) throw salesError

    const { data: recipes, error: recipeError } = await supabase
      .from('product_recipes')
      .select('product_id, quantity_required, wastage_percentage, inventory_items(cost_per_unit, unit)')
    if (recipeError) throw recipeError

    const dailyStats = {}
    let totalRevenue = 0
    let totalCost = 0

    sales.forEach((payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0]
      if (!dailyStats[date]) dailyStats[date] = { date, sales: 0, costs: 0, profit: 0 }

      dailyStats[date].sales += numberValue(payment.amount)
      totalRevenue += numberValue(payment.amount)

      payment.orders?.order_items?.forEach((item) => {
        recipes
          .filter((recipe) => recipe.product_id === item.product_id)
          .forEach((recipe) => {
            const cost = numberValue(recipe.inventory_items?.cost_per_unit)
            const quantity = numberValue(recipe.quantity_required)
            const wastage = numberValue(recipe.wastage_percentage)
            const itemCost = quantity * (1 + wastage / 100) * cost * (item.quantity || 1)
            dailyStats[date].costs += itemCost
            totalCost += itemCost
          })
      })
    })

    const history = Object.values(dailyStats)
      .map((day) => ({
        ...day,
        profit: day.sales - day.costs,
        margin: day.sales > 0 ? ((day.sales - day.costs) / day.sales) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return {
      history,
      totals: {
        revenue: totalRevenue,
        costs: totalCost,
        profit: totalRevenue - totalCost,
        avgMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
      }
    }
  }

  const getIngredientForecast = async (daysToPredict = 7, historicalDays = 30) => {
    const now = new Date()
    const historicalStart = new Date(now.getTime() - historicalDays * 24 * 60 * 60 * 1000)

    const { data: historicalSales, error: salesError } = await supabase
      .from('order_items')
      .select('product_id, quantity, created_at')
      .gte('created_at', historicalStart.toISOString())
    if (salesError) throw salesError

    const { data: recipes, error: recipeError } = await supabase
      .from('product_recipes')
      .select(`
        product_id,
        quantity_required,
        inventory_items (
          id,
          name,
          unit,
          current_stock,
          min_stock,
          cost_per_unit
        )
      `)
    if (recipeError) throw recipeError

    const productConsumption = historicalSales.reduce((acc, sale) => {
      acc[sale.product_id] = (acc[sale.product_id] || 0) + (sale.quantity || 1)
      return acc
    }, {})

    const ingredientNeeds = {}

    recipes.forEach((recipe) => {
      const ingredient = recipe.inventory_items
      if (!ingredient) return

      if (!ingredientNeeds[ingredient.id]) {
        ingredientNeeds[ingredient.id] = {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          currentStock: numberValue(ingredient.current_stock),
          minStock: numberValue(ingredient.min_stock),
          costPerUnit: numberValue(ingredient.cost_per_unit),
          dailyRequirement: 0
        }
      }

      ingredientNeeds[ingredient.id].dailyRequirement += numberValue(recipe.quantity_required) * ((productConsumption[recipe.product_id] || 0) / historicalDays)
    })

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
    })

    return {
      items: items.sort((a, b) => b.estimatedCost - a.estimatedCost),
      totalEstimatedCost: items.reduce((sum, item) => sum + item.estimatedCost, 0),
      urgentCount: items.filter((item) => item.isUrgent).length
    }
  }

  const exportToExcel = (data, filename) => {
    try {
      const XLSX = window.XLSX
      if (!XLSX) {
        toast.error('Error: libreria de Excel no cargada.')
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
      const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename.split('.')[0]}.xlsx`
      XLSX.writeFile(workbook, fullFilename)
      toast.success(`Reporte exportado: ${fullFilename}`)
    } catch (err) {
      console.error('Excel Export Error:', err)
      toast.error('No se pudo generar el archivo Excel')
    }
  }

  return {
    loading,
    error,
    fetchReportData,
    getDailySales,
    getSalesComparison,
    getProductAnalysis,
    getTopProducts,
    getHourlyAnalysis,
    getFinancialKPIs,
    getInventoryAnalysis,
    getStaffPerformance,
    getCustomerAnalysis,
    getAdvancedFinancials,
    getCostVsSales,
    getIngredientForecast,
    exportToExcel,
    formatCurrency,
    formatDate
  }
}
