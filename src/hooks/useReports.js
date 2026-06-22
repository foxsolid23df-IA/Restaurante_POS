import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { reportsApi, numberValue } from '@/features/reports/api/reportsApi'
import { useBranchStore } from '@/store/branchStore'

const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(numberValue(amount))

const formatDate = (dateString) => new Date(`${dateString}T00:00:00`).toLocaleDateString('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const percentChange = (current, previous) => {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

const isoDate = (date) => date.toISOString().split('T')[0]

const filtersFromPeriod = (period = 'month') => {
  const end = new Date()
  const start = new Date()

  if (period === 'today') {
    return { startDate: isoDate(end), endDate: isoDate(end), period }
  }
  if (period === 'week') start.setDate(end.getDate() - 7)
  else if (period === 'year') start.setFullYear(end.getFullYear() - 1)
  else start.setMonth(end.getMonth() - 1)

  return { startDate: isoDate(start), endDate: isoDate(end), period }
}

const normalizeFilters = (filters = {}) => {
  if (typeof filters === 'string') return { startDate: filters, endDate: filters }
  if (filters.date) return { ...filters, startDate: filters.date, endDate: filters.date }
  return filters
}

export function useReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const runReport = useCallback(async (runner) => {
    setLoading(true)
    setError(null)

    try {
      return await runner()
    } catch (err) {
      const message = err?.message || 'No se pudo cargar el reporte'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getDailySales = useCallback((filters = {}) => runReport(async () => {
    const report = await reportsApi.getSalesReport(normalizeFilters(filters), currentBranch)
    return {
      totalSales: numberValue(report.totalSales),
      cashSales: numberValue(report.cashSales),
      cardSales: numberValue(report.cardSales),
      otherSales: numberValue(report.otherSales),
      totalOrders: numberValue(report.totalOrders),
      totalPayments: numberValue(report.totalPayments),
      averageTicket: numberValue(report.averageTicket),
      totalCost: numberValue(report.totalCost),
      grossProfit: numberValue(report.grossProfit),
      grossMargin: numberValue(report.grossMargin),
      productsWithoutRecipe: numberValue(report.productsWithoutRecipe),
      productsWithoutCost: numberValue(report.productsWithoutCost),
      paymentMethods: report.paymentMethods || {},
      source: report.source || 'payments'
    }
  }), [currentBranch, runReport])

  const getSalesComparison = useCallback((currentPeriod, previousPeriod) => runReport(async () => {
    const [current, previous] = await Promise.all([
      reportsApi.getSalesReport(normalizeFilters(currentPeriod), currentBranch),
      reportsApi.getSalesReport(normalizeFilters(previousPeriod), currentBranch)
    ])

    const currentSales = numberValue(current.totalSales)
    const previousSales = numberValue(previous.totalSales)
    const currentOrders = numberValue(current.totalOrders)
    const previousOrders = numberValue(previous.totalOrders)
    const currentAvgTicket = currentOrders > 0 ? currentSales / currentOrders : 0
    const previousAvgTicket = previousOrders > 0 ? previousSales / previousOrders : 0

    return {
      current: { sales: currentSales, orders: currentOrders, avgTicket: currentAvgTicket },
      previous: { sales: previousSales, orders: previousOrders, avgTicket: previousAvgTicket },
      variance: {
        sales: percentChange(currentSales, previousSales),
        orders: percentChange(currentOrders, previousOrders),
        avgTicket: percentChange(currentAvgTicket, previousAvgTicket)
      }
    }
  }), [currentBranch, runReport])

  const getProductAnalysis = useCallback((filters = {}) => runReport(async () => {
    return reportsApi.getProductPerformance(normalizeFilters(filters), currentBranch)
  }), [currentBranch, runReport])

  const getTopProducts = useCallback((metric = 'revenue', limit = 10, filters = {}) => runReport(async () => {
    const products = await reportsApi.getProductPerformance(normalizeFilters(filters), currentBranch)
    return [...products].sort((a, b) => numberValue(b[metric]) - numberValue(a[metric])).slice(0, limit)
  }), [currentBranch, runReport])

  const getHourlyAnalysis = useCallback((filters = {}) => runReport(async () => {
    return reportsApi.getHourlySales(normalizeFilters(filters), currentBranch)
  }), [currentBranch, runReport])

  const getFinancialKPIs = useCallback((periodOrFilters = 'month') => runReport(async () => {
    const filters = typeof periodOrFilters === 'string'
      ? filtersFromPeriod(periodOrFilters)
      : normalizeFilters(periodOrFilters)
    const summary = await reportsApi.getSalesReport(filters, currentBranch)

    return {
      period: filters.period || 'custom',
      revenue: numberValue(summary.totalSales),
      estimatedCosts: numberValue(summary.totalCost),
      grossProfit: numberValue(summary.grossProfit),
      profitMargin: numberValue(summary.grossMargin),
      avgDailyRevenue: numberValue(summary.totalSales) / Math.max(1, daysBetween(filters.startDate, filters.endDate)),
      efficiency: numberValue(summary.averageTicket),
      productsWithoutRecipe: numberValue(summary.productsWithoutRecipe),
      productsWithoutCost: numberValue(summary.productsWithoutCost)
    }
  }), [currentBranch, runReport])

  const getInventoryAnalysis = useCallback((filters = {}) => runReport(async () => {
    return reportsApi.getInventoryAnalysis(normalizeFilters(filters), currentBranch)
  }), [currentBranch, runReport])

  const getAdvancedFinancials = useCallback((filters = {}) => runReport(async () => {
    const summary = await reportsApi.getSalesReport(normalizeFilters(filters), currentBranch)
    const paymentMethodAnalysis = Object.entries(summary.paymentMethods || {}).reduce((acc, [method, total]) => {
      acc[method] = {
        count: null,
        total: numberValue(total),
        avgAmount: null
      }
      return acc
    }, {})

    return {
      totalRevenue: numberValue(summary.totalSales),
      totalTransactions: numberValue(summary.totalPayments),
      avgTransactionSize: numberValue(summary.totalPayments) > 0
        ? numberValue(summary.totalSales) / numberValue(summary.totalPayments)
        : 0,
      paymentMethodAnalysis,
      totalCost: numberValue(summary.totalCost),
      grossProfit: numberValue(summary.grossProfit),
      grossMargin: numberValue(summary.grossMargin),
      source: summary.source || 'payments'
    }
  }), [currentBranch, runReport])

  const getCostVsSales = useCallback((filters = {}) => runReport(async () => {
    const normalized = normalizeFilters(filters)
    const history = await buildDailyHistory(normalized, currentBranch)
    const totals = history.reduce((acc, day) => {
      acc.revenue += numberValue(day.sales)
      acc.costs += numberValue(day.costs)
      return acc
    }, { revenue: 0, costs: 0 })

    const profit = totals.revenue - totals.costs

    return {
      history,
      totals: {
        revenue: totals.revenue,
        costs: totals.costs,
        profit,
        avgMargin: totals.revenue > 0 ? (profit / totals.revenue) * 100 : 0
      }
    }
  }), [currentBranch, runReport])

  const getIngredientForecast = useCallback((daysToPredict = 7, historicalDays = 30) => runReport(async () => {
    return reportsApi.getIngredientForecast({ daysToPredict, historicalDays }, currentBranch)
  }), [currentBranch, runReport])

  const exportToExcel = useCallback((data, filename) => {
    try {
      reportsApi.exportToExcel(data, filename)
      toast.success(`Reporte exportado: ${filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`}`)
    } catch (err) {
      console.error('Excel Export Error:', err)
      toast.error('No se pudo generar el archivo Excel')
    }
  }, [])

  return {
    loading,
    error,
    getDailySales,
    getSalesComparison,
    getProductAnalysis,
    getTopProducts,
    getHourlyAnalysis,
    getFinancialKPIs,
    getInventoryAnalysis,
    getStaffPerformance: async () => [],
    getCustomerAnalysis: async () => [],
    getAdvancedFinancials,
    getCostVsSales,
    getIngredientForecast,
    exportToExcel,
    formatCurrency,
    formatDate
  }
}

const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 1
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

const buildDailyHistory = async (filters, currentBranch) => {
  const start = new Date(`${filters.startDate}T00:00:00`)
  const end = new Date(`${filters.endDate}T00:00:00`)
  const days = []

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(isoDate(new Date(cursor)))
  }

  const reports = await Promise.all(days.map((date) => (
    reportsApi.getSalesReport({ ...filters, startDate: date, endDate: date }, currentBranch)
  )))

  return reports.map((report, index) => {
    const sales = numberValue(report.totalSales)
    const costs = numberValue(report.totalCost)
    const profit = sales - costs

    return {
      date: days[index],
      sales,
      costs,
      profit,
      margin: sales > 0 ? (profit / sales) * 100 : 0
    }
  })
}
