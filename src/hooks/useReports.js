import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, Calendar, Download, Filter, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

// Utility functions para reportes
const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(amount)

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

import { useBranchStore } from '@/store/branchStore'

export function useReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  // Función genérica para obtener datos con filtros
  const fetchReportData = async (table, select = '*', filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      // Si no existe la tabla payments, usar orders y simular datos
      if (table === 'payments') {
        let orderQuery = supabase
          .from('orders')
          .select(`id, total_amount, created_at, status, user_id, branch_id, tables!inner(name)`)
          .not('total_amount', 'is', null)
          .eq('status', 'completed')
        
        if (currentBranch?.id && !filters.consolidated) {
          orderQuery = orderQuery.eq('branch_id', currentBranch.id)
        }

        const { data: orders, error } = await orderQuery

        if (error) throw error

        // Si no hay órdenes, simular datos de ejemplo para los reportes
        if (!orders || orders.length === 0) {
          const simulatedOrders = [
            { id: 1, total_amount: 150.50, created_at: '2026-01-27T10:30:00Z', status: 'completed', user_id: 'user1', tables: { name: 'Mesa 1' } },
            { id: 2, total_amount: 89.75, created_at: '2026-01-27T12:15:00Z', status: 'completed', user_id: 'user2', tables: { name: 'Mesa 2' } },
            { id: 3, total_amount: 235.00, created_at: '2026-01-27T14:45:00Z', status: 'completed', user_id: 'user1', tables: { name: 'Mesa 3' } },
            { id: 4, total_amount: 125.25, created_at: '2026-01-27T18:20:00Z', status: 'completed', user_id: 'user3', tables: { name: 'Mesa 4' } },
            { id: 5, total_amount: 178.90, created_at: '2026-01-27T20:10:00Z', status: 'completed', user_id: 'user2', tables: { name: 'Mesa 5' } }
          ]

          const simulatedPayments = simulatedOrders.map(order => ({
            id: order.id,
            amount: order.total_amount,
            payment_method: Math.random() > 0.5 ? 'cash' : 'card',
            created_at: order.created_at,
            order_id: order.id,
            orders: order
          }))

          return { data: simulatedPayments, error: null }
        }

        // Simular datos de pagos a partir de órdenes reales
        let simulatedPayments = orders.map(order => ({
          id: order.id,
          amount: order.total_amount,
          payment_method: Math.random() > 0.5 ? 'cash' : 'card',
          created_at: order.created_at,
          order_id: order.id,
          orders: order
        }))

        // Aplicar filtros de fecha a los datos simulados si existen
        if (filters.startDate || filters.endDate) {
          simulatedPayments = simulatedPayments.filter(payment => {
            const paymentDate = new Date(payment.created_at)
            if (filters.startDate && paymentDate < new Date(filters.startDate)) return false
            if (filters.endDate && paymentDate > new Date(filters.endDate + 'T23:59:59.999Z')) return false
            return true
          })
        }

        if (filters.date) {
          simulatedPayments = simulatedPayments.filter(payment => {
            const paymentDate = new Date(payment.created_at).toISOString().split('T')[0]
            return paymentDate === filters.date
          })
        }

        return { data: simulatedPayments || [], error: null }
      }

      let query = supabase
        .from(table)
        .select(select)
      
      // Filtro de sucursal (excepto para tablas globales)
      if (currentBranch?.id && !filters.consolidated && !['products', 'categories', 'users'].includes(table)) {
        query = query.eq('branch_id', currentBranch.id)
      }

      // Aplicar filtros dinámicamente
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }
      if (filters.date) {
        const dateStr = filters.date
        if (!dateStr || isNaN(new Date(dateStr).getTime())) {
          throw new Error('Fecha inválida')
        }
        const start = new Date(dateStr + 'T00:00:00.000Z')
        const end = new Date(dateStr + 'T23:59:59.999Z')
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      }
      if (filters.categoryId) {
        if (table === 'payments') {
          query = query.eq('orders.order_items.products.category_id', filters.categoryId)
        } else {
          query = query.eq('category_id', filters.categoryId)
        }
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.productId) {
        query = query.eq('product_id', filters.productId)
      }

      const { data, error } = await query
      return { data: data || [], error }
    } catch (err) {
      setError(err.message)
      return { data: [], error: err }
    } finally {
      setLoading(false)
    }
  }

  // Reporte de ventas diarias
  const getDailySales = async (filters = {}) => {
    // Si solo es un string (date), convertir a objeto de filtro
    if (typeof filters === 'string') {
      filters = { date: filters }
    }
    
    const { data, error } = await fetchReportData('payments', 
      `amount, payment_method, created_at, 
       orders!inner(created_at, tables(name))`,
      filters
    )
    
    if (error) throw error
    
    const summary = {
      totalSales: data.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      cashSales: data.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + parseFloat(p.amount), 0),
      cardSales: data.filter(p => p.payment_method === 'card').reduce((sum, p) => sum + parseFloat(p.amount), 0),
      otherSales: data.filter(p => !['cash', 'card'].includes(p.payment_method)).reduce((sum, p) => sum + parseFloat(p.amount), 0),
      totalOrders: new Set(data.map(p => p.orders?.id)).size,
      paymentMethods: data.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + parseFloat(p.amount)
        return acc
      }, {})
    }
    
    return summary
  }

  // Comparación de períodos
  const getSalesComparison = async (currentPeriod, previousPeriod) => {
    const [current, prev] = await Promise.all([
      getDailySales(currentPeriod),
      getDailySales(previousPeriod)
    ])
    
    const variance = current.totalSales > 0 
      ? ((current.totalSales - prev.totalSales) / prev.totalSales) * 100 
      : 0

    return {
      current: {
        sales: current.totalSales,
        orders: current.totalOrders,
        avgTicket: current.totalOrders > 0 ? current.totalSales / current.totalOrders : 0
      },
      previous: {
        sales: prev.totalSales,
        orders: prev.totalOrders,
        avgTicket: prev.totalOrders > 0 ? prev.totalSales / prev.totalOrders : 0
      },
      variance: {
        sales: variance,
        orders: ((current.totalOrders - prev.totalOrders) / prev.totalOrders) * 100,
        avgTicket: ((current.avgTicket - prev.avgTicket) / prev.avgTicket) * 100
      }
    }
  }

  // Análisis de productos
  const getProductAnalysis = async (filters = {}) => {
    const { data: sales, error } = await fetchReportData('payments', 
      `amount, 
       orders!inner(order_items!inner(
         quantity, 
         price_at_order,
         products!inner(name, category_id)
       ))
      `,
      filters
    )

    if (error) throw error

    const productMetrics = {}
    
    sales.forEach(sale => {
      if (sale.orders?.order_items) {
        sale.orders.order_items.forEach(item => {
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
          productMetrics[productKey].revenue += (item.price_at_order || 0) * (item.quantity || 1)
          productMetrics[productKey].orders.add(sale.order_id)
        })
      }
    })

    // Calcular promedios y clasificar
    return Object.values(productMetrics)
      .map(product => ({
        ...product,
        avgPrice: product.revenue / product.quantity,
        orderCount: product.orders.size,
        avgPerOrder: product.quantity / product.orders.size,
        profitability: product.revenue > 0 ? (product.revenue - (product.revenue * 0.3)) / product.revenue : 0 // Asumiendo 30% costo
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  // Análisis horario
  const getHourlyAnalysis = async (filters = {}) => {
    // Si solo es un string (date), convertir a objeto de filtro
    if (typeof filters === 'string') {
      filters = { date: filters }
    }
    
    const { data: sales, error } = await fetchReportData('payments',
      `amount, created_at`,
      filters
    )

    if (error) throw error

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      orders: 0,
      avgTicket: 0,
      peak: false
    }))

    sales.forEach(sale => {
      const hour = new Date(sale.created_at).getHours()
      if (hour >= 0 && hour < 24) {
        hourlyData[hour].sales += parseFloat(sale.amount)
        hourlyData[hour].orders += 1
      }
    })

    // Calcular promedios y hora pico
    const avgSales = hourlyData.reduce((sum, h) => sum + h.sales, 0) / 24
    hourlyData.forEach(h => {
      h.avgTicket = h.orders > 0 ? h.sales / h.orders : 0
      h.peak = h.sales > avgSales * 1.5
    })

    return hourlyData
  }

  // Top productos por métrica
  const getTopProducts = async (metric = 'revenue', limit = 10, filters = {}) => {
    const products = await getProductAnalysis(filters)
    
    return products
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit)
  }

  // KPIs financieros
  const getFinancialKPIs = async (period = 'month') => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    const summary = await getDailySales({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })

    // Estimar costos (simplificado)
    const estimatedCosts = summary.totalSales * 0.7 // 70% de ventas como costo
    const grossProfit = summary.totalSales - estimatedCosts

    return {
      period,
      revenue: summary.totalSales,
      estimatedCosts,
      grossProfit,
      profitMargin: summary.totalSales > 0 ? (grossProfit / summary.totalSales) * 100 : 0,
      breakEvenPoint: summary.totalSales > 0 ? estimatedCosts / (summary.totalSales - estimatedCosts) * 30 : 0, // días
      avgDailyRevenue: summary.totalSales / 30,
      efficiency: summary.totalOrders > 0 ? summary.totalSales / (summary.totalOrders * 8) * 100 : 0 // 8 horas promedio día
    }
  }

  // Análisis de inventario y rotación
  const getInventoryAnalysis = async (filters = {}) => {
    const { data: products, error } = await fetchReportData('products', 
      `name, category_id, price, cost, stock, min_stock, created_at, 
       categories!inner(name)`,
      filters
    )

    if (error) throw error

    const { data: sales, error: salesError } = await fetchReportData('payments', 
      `amount, created_at, 
       orders!inner(order_items!inner(
         quantity, 
         product_id,
         price_at_order
       ))`,
      filters
    )

    if (salesError) throw salesError

    // Analizar cada producto
    const inventoryMetrics = products.map(product => {
      const productSales = sales.flatMap(sale => 
        sale.orders?.order_items?.filter(item => item.product_id === product.id) || []
      )

      const totalSold = productSales.reduce((sum, item) => sum + (item.quantity || 1), 0)
      const totalRevenue = productSales.reduce((sum, item) => sum + (item.price_at_order || 0) * (item.quantity || 1), 0)
      const daysInPeriod = 30 // Simplificado
      const turnoverRate = product.stock > 0 ? (totalSold / product.stock) * 100 : 0
      const daysOfInventory = totalSold > 0 ? (product.stock / totalSold) * daysInPeriod : 999
      const totalValue = product.stock * product.price
      const totalCost = product.stock * product.cost
      const profitMargin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0

      return {
        ...product,
        totalSold,
        totalRevenue,
        turnoverRate,
        daysOfInventory,
        totalValue,
        totalCost,
        profitMargin,
        stockout: product.stock <= product.min_stock,
        category: product.categories?.name || 'Sin categoría'
      }
    })

    return {
      products: inventoryMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue),
      lowStock: inventoryMetrics.filter(p => p.stockout),
      fastMoving: inventoryMetrics.filter(p => p.turnoverRate > 80),
      slowMoving: inventoryMetrics.filter(p => p.turnoverRate < 20),
      totalInventoryValue: inventoryMetrics.reduce((sum, p) => sum + p.totalValue, 0),
      totalInventoryCost: inventoryMetrics.reduce((sum, p) => sum + p.totalCost, 0)
    }
  }

  // Análisis de rendimiento del personal
  const getStaffPerformance = async (filters = {}) => {
    const { data: sales, error } = await fetchReportData('payments', 
      `amount, payment_method, created_at, user_id,
       orders!inner(
         total_amount,
         created_at,
         tables(name),
         user_id,
         order_items!inner(quantity, price_at_order)
       )`,
      filters
    )

    if (error) throw error

    const { data: users, error: userError } = await fetchReportData('users', 
      `id, name, role, created_at`,
      {}
    )

    if (userError) throw userError

    const staffMetrics = {}

    sales.forEach(sale => {
      const user = users.find(u => u.id === sale.user_id)
      if (!user) return

      const userName = user.name || 'Usuario sin nombre'
      
      if (!staffMetrics[userName]) {
        staffMetrics[userName] = {
          name: userName,
          role: user.role,
          totalSales: 0,
          totalOrders: new Set(),
          avgTicket: 0,
          totalItems: 0,
          cashTransactions: 0,
          cardTransactions: 0,
          hourlyBreakdown: {},
          shiftAnalysis: { morning: 0, afternoon: 0, evening: 0 }
        }
      }

      const staff = staffMetrics[userName]
      staff.totalSales += parseFloat(sale.amount)
      staff.totalOrders.add(sale.order_id)
      
      if (sale.payment_method === 'cash') staff.cashTransactions++
      else if (sale.payment_method === 'card') staff.cardTransactions++

      // Analizar horas
      const hour = new Date(sale.created_at).getHours()
      staff.hourlyBreakdown[hour] = (staff.hourlyBreakdown[hour] || 0) + parseFloat(sale.amount)

      // Analizar turnos
      if (hour >= 6 && hour < 14) staff.shiftAnalysis.morning += parseFloat(sale.amount)
      else if (hour >= 14 && hour < 22) staff.shiftAnalysis.afternoon += parseFloat(sale.amount)
      else staff.shiftAnalysis.evening += parseFloat(sale.amount)

      // Contar items
      if (sale.orders?.order_items) {
        sale.orders.order_items.forEach(item => {
          staff.totalItems += item.quantity || 1
        })
      }
    })

    return Object.values(staffMetrics)
      .map(staff => ({
        ...staff,
        orderCount: staff.totalOrders.size,
        avgTicket: staff.orderCount > 0 ? staff.totalSales / staff.orderCount : 0,
        avgItemsPerOrder: staff.orderCount > 0 ? staff.totalItems / staff.orderCount : 0,
        efficiency: staff.orderCount > 0 ? (staff.totalSales / staff.orderCount) * 10 : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
  }

  // Análisis de clientes
  const getCustomerAnalysis = async (filters = {}) => {
    const { data: orders, error } = await fetchReportData('orders',
      `id, total_amount, created_at, table_id, status, customer_info,
       tables(name),
       order_items!inner(
         quantity, 
         price_at_order,
         product_id
       )`,
      filters
    )

    if (error) throw error

    const customerMetrics = {}
    let totalCustomers = 0

    orders.forEach(order => {
      const customerId = order.customer_info?.id || `table_${order.table_id || 'unknown'}_${new Date(order.created_at).toDateString()}`
      const isTableCustomer = !order.customer_info?.id

      if (!customerMetrics[customerId]) {
        customerMetrics[customerId] = {
          customerId,
          name: order.customer_info?.name || `Mesa ${order.tables?.name || 'Desconocida'}`,
          type: isTableCustomer ? 'walk_in' : 'regular',
          totalOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          favoriteItems: {},
          visitFrequency: 0,
          lastVisit: null,
          firstVisit: order.created_at,
          totalItems: 0
        }
        if (!isTableCustomer) totalCustomers++
      }

      const customer = customerMetrics[customerId]
      customer.totalOrders++
      customer.totalSpent += parseFloat(order.total_amount)
      customer.lastVisit = new Date(order.created_at) > new Date(customer.lastVisit) ? order.created_at : customer.lastVisit

      // Analizar productos favoritos
      if (order.order_items) {
        order.order_items.forEach(item => {
          const itemId = item.product_id
          customer.favoriteItems[itemId] = (customer.favoriteItems[itemId] || 0) + (item.quantity || 1)
          customer.totalItems += item.quantity || 1
        })
      }
    })

    // Calcular métricas adicionales
    return Object.values(customerMetrics)
      .map(customer => {
        const daysBetweenFirstAndLast = customer.firstVisit && customer.lastVisit 
          ? Math.ceil((new Date(customer.lastVisit) - new Date(customer.firstVisit)) / (1000 * 60 * 60 * 24))
          : 1

        return {
          ...customer,
          avgOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
          visitFrequency: daysBetweenFirstAndLast > 0 ? customer.totalOrders / daysBetweenFirstAndLast : customer.totalOrders,
          topFavoriteItem: Object.keys(customer.favoriteItems).length > 0 
            ? Object.entries(customer.favoriteItems).reduce((a, b) => a[1] > b[1] ? a : b)[0]
            : null,
          customerValue: customer.totalSpent * (customer.type === 'regular' ? 1.2 : 1.0) // Bonificar clientes regulares
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
  }

  // Reportes financieros avanzados
  const getAdvancedFinancials = async (filters = {}) => {
    const { data: payments, error } = await fetchReportData('payments',
      `amount, payment_method, created_at, 
       orders!inner(
         total_amount,
         order_items!inner(
           quantity, 
           price_at_order,
           product_id
         )
       )`,
      filters
    )

    if (error) throw error

    // Análisis por método de pago
    const paymentMethodAnalysis = payments.reduce((acc, payment) => {
      const method = payment.payment_method
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0, avgAmount: 0 }
      }
      acc[method].count++
      acc[method].total += parseFloat(payment.amount)
      return acc
    }, {})

    Object.keys(paymentMethodAnalysis).forEach(method => {
      paymentMethodAnalysis[method].avgAmount = 
        paymentMethodAnalysis[method].count > 0 
          ? paymentMethodAnalysis[method].total / paymentMethodAnalysis[method].count 
          : 0
    })

    // Flujo de caja diario
    const cashFlow = payments.reduce((acc, payment) => {
      const date = new Date(payment.created_at).toDateString()
      if (!acc[date]) {
        acc[date] = { inflow: 0, outflow: 0, net: 0 }
      }
      acc[date].inflow += parseFloat(payment.amount)
      acc[date].net = acc[date].inflow - acc[date].outflow
      return acc
    }, {})

    // Métricas financieras
    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    const totalTransactions = payments.length
    const avgTransactionSize = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    return {
      totalRevenue,
      totalTransactions,
      avgTransactionSize,
      paymentMethodAnalysis,
      cashFlow: Object.entries(cashFlow).map(([date, data]) => ({ date, ...data })),
      revenueGrowth: 0, // Necesitaría comparación con período anterior
      profitMargin: 0, // Necesitaría datos de costos
      breakEvenAnalysis: {
        currentRevenue: totalRevenue,
        breakEvenPoint: totalRevenue * 0.8 // Simplificado
      }
    }
  }

  // Reporte Comparativo de Costos vs Ventas (Real basado en Recetas)
  const getCostVsSales = async (filters = {}) => {
    // 1. Obtener Ventas (Payments -> Orders -> Order Items)
    const { data: sales, error: salesError } = await fetchReportData('payments', 
      `amount, created_at, order_id,
       orders!inner(order_items!inner(product_id, quantity, price_at_order))`,
      filters
    )
    if (salesError) throw salesError

    // 2. Obtener Recetas e Inventario
    const { data: recipes, error: recipeError } = await supabase
      .from('product_recipes')
      .select(`product_id, quantity_required, wastage_percentage, inventory_items(cost_per_unit, unit)`)
    if (recipeError) throw recipeError

    // 3. Procesar datos
    const dailyStats = {}
    let totalRevenue = 0
    let totalCost = 0

    sales.forEach(payment => {
      const date = new Date(payment.created_at).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { date, sales: 0, costs: 0, profit: 0 }
      }

      dailyStats[date].sales += parseFloat(payment.amount)
      totalRevenue += parseFloat(payment.amount)

      // Calcular costo de la orden basado en recetas
      if (payment.orders?.order_items) {
        payment.orders.order_items.forEach(item => {
          const productRecipes = recipes.filter(r => r.product_id === item.product_id)
          
          productRecipes.forEach(recipe => {
            const unitCost = recipe.inventory_items?.cost_per_unit || 0
            const qty = recipe.quantity_required || 0
            const wastage = recipe.wastage_percentage || 0
            
            const costOfIngredient = qty * (1 + (wastage / 100)) * unitCost
            const itemTotalCost = costOfIngredient * item.quantity
            
            dailyStats[date].costs += itemTotalCost
            totalCost += itemTotalCost
          })
        })
      }
    })

    // Finalizar cálculos diarios
    const reportData = Object.values(dailyStats).map(d => ({
      ...d,
      profit: d.sales - d.costs,
      margin: d.sales > 0 ? ((d.sales - d.costs) / d.sales) * 100 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date))

    return {
      history: reportData,
      totals: {
        revenue: totalRevenue,
        costs: totalCost,
        profit: totalRevenue - totalCost,
        avgMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
      }
    }
  }

  // Proyección de compra de insumos para la próxima semana
  const getIngredientForecast = async (daysToPredict = 7, historicalDays = 30) => {
    try {
      const now = new Date()
      const historicalStart = new Date(now.getTime() - (historicalDays * 24 * 60 * 60 * 1000))
      
      // 1. Obtener ventas históricas detalladas
      const { data: historicalSales, error: salesError } = await supabase
        .from('order_items')
        .select(`product_id, quantity, created_at`)
        .gte('created_at', historicalStart.toISOString())
      
      if (salesError) throw salesError

      // 2. Obtener recetas de todos los productos
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

      // 3. Calcular consumo promedio diario por producto
      const productDailyConsumption = historicalSales.reduce((acc, sale) => {
        acc[sale.product_id] = (acc[sale.product_id] || 0) + sale.quantity
        return acc
      }, {})

      // 4. Mapear consumo de productos a ingredientes
      const ingredientNeeds = {}
      
      recipes.forEach(recipe => {
        const productSold = productDailyConsumption[recipe.product_id] || 0
        const dailyAvgProduct = productSold / historicalDays
        const ingredient = recipe.inventory_items

        if (!ingredient) return

        if (!ingredientNeeds[ingredient.id]) {
          ingredientNeeds[ingredient.id] = {
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            currentStock: parseFloat(ingredient.current_stock || 0),
            minStock: parseFloat(ingredient.min_stock || 0),
            costPerUnit: parseFloat(ingredient.cost_per_unit || 0),
            dailyRequirement: 0
          }
        }

        const quantityNeeded = parseFloat(recipe.quantity_required) * dailyAvgProduct
        ingredientNeeds[ingredient.id].dailyRequirement += quantityNeeded
      })

      // 5. Generar proyección para la próxima semana
      const forecast = Object.values(ingredientNeeds).map(item => {
        const neededForWeek = item.dailyRequirement * daysToPredict
        const stockGap = Math.max(0, (neededForWeek + item.minStock) - item.currentStock)
        const estimatedCost = stockGap * item.costPerUnit

        return {
          ...item,
          neededNextWeek: neededForWeek,
          toBuy: stockGap,
          estimatedCost: estimatedCost,
          isUrgent: item.currentStock < item.minStock
        }
      })

      return {
        items: forecast.sort((a, b) => b.estimatedCost - a.estimatedCost),
        totalEstimatedCost: forecast.reduce((sum, item) => sum + item.estimatedCost, 0),
        urgentCount: forecast.filter(i => i.isUrgent).length
      }
    } catch (err) {
      console.error('Error in forecasting:', err)
      throw err
    }
  }

  // Función de exportación a Excel
  const exportToExcel = (data, filename) => {
    try {
      const XLSX = window.XLSX;
      if (!XLSX) {
        toast.error("Error: Librería de Excel no cargada.");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
      
      // Asegurar extensión .xlsx
      const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename.split('.')[0]}.xlsx`;
      XLSX.writeFile(workbook, fullFilename);
      
      toast.success(`Reporte exportado: ${fullFilename}`);
    } catch (err) {
      console.error("Excel Export Error:", err);
      toast.error("No se pudo generar el archivo Excel");
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