import { getCurrencyInfo, formatCurrency, convertCurrency, getCurrentRates, getBranchCurrencyMapping } from '@/features/i18n/currency'
import { reportsApi } from './api/reportsApi'

export async function getMultiCurrencySalesReport(filters = {}) {
  const report = await reportsApi.getSalesReport(filters)
  if (!report) return null

  const rates = getCurrentRates()
  const targetCurrency = filters.targetCurrency || 'USD'

  const converted = {
    ...report,
    totalSales: convertCurrency(report.totalSales || 0, 'MXN', targetCurrency, rates),
    totalTax: convertCurrency(report.totalTax || 0, 'MXN', targetCurrency, rates),
    totalDiscounts: convertCurrency(report.totalDiscounts || 0, 'MXN', targetCurrency, rates),
    averageTicket: convertCurrency(report.averageTicket || 0, 'MXN', targetCurrency, rates),
    targetCurrency,
    targetInfo: getCurrencyInfo(targetCurrency),
    baseCurrency: 'MXN',
  }

  if (converted.dailySales) {
    converted.dailySales = converted.dailySales.map((day) => ({
      ...day,
      convertedTotal: convertCurrency(day.total || 0, 'MXN', targetCurrency, rates),
    }))
  }

  if (converted.paymentMethods) {
    converted.paymentMethods = converted.paymentMethods.map((pm) => ({
      ...pm,
      convertedAmount: convertCurrency(pm.amount || 0, 'MXN', targetCurrency, rates),
    }))
  }

  return converted
}

export async function getConsolidatedBranchReport(branchIds, filters = {}) {
  const currencyMap = await getBranchCurrencyMapping(branchIds)
  const rates = getCurrentRates()
  const targetCurrency = filters.targetCurrency || 'MXN'

  const branchReports = await Promise.all(
    branchIds.map(async (branchId) => {
      try {
        const report = await reportsApi.getSalesReport({ ...filters, branchId })
        const branchCurrency = currencyMap[branchId] || 'MXN'
        return {
          branchId,
          branchCurrency,
          report,
          convertedTotal: report?.totalSales
            ? convertCurrency(report.totalSales, branchCurrency, targetCurrency, rates)
            : 0,
        }
      } catch {
        return { branchId, branchCurrency: 'MXN', report: null, convertedTotal: 0 }
      }
    })
  )

  const grandTotal = branchReports.reduce((sum, br) => sum + (br.convertedTotal || 0), 0)

  return {
    branchReports,
    grandTotal,
    targetCurrency,
    formattedGrandTotal: formatCurrency(grandTotal, targetCurrency, rates),
    rates,
    generatedAt: new Date().toISOString(),
  }
}

export function formatMultiCurrency(amount, fromCurrency, toCurrency, rates = null) {
  const r = rates || getCurrentRates()
  const converted = convertCurrency(amount, fromCurrency, toCurrency, r)
  return {
    original: { amount, currency: fromCurrency, formatted: formatCurrency(amount, fromCurrency) },
    converted: { amount: converted, currency: toCurrency, formatted: formatCurrency(converted, toCurrency, r) },
    rate: r ? r[toCurrency] / (r[fromCurrency] || 1) : null,
  }
}
