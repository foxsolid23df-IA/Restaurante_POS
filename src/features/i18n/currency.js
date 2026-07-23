import { supabase } from '@/lib/supabase'
import {
  initRateService, getCurrentRates, convertCurrency as convert,
  subscribeRates, changeBaseCurrency, getLastFetchTime,
} from './exchangeRateService'

export {
  initRateService, getCurrentRates, subscribeRates, changeBaseCurrency, getLastFetchTime,
}

const CURRENCIES = {
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano', locale: 'es-MX', decimals: 2 },
  USD: { code: 'USD', symbol: 'US$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES', decimals: 2 },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano', locale: 'es-CO', decimals: 0 },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino', locale: 'es-AR', decimals: 2 },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno', locale: 'es-CL', decimals: 0 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', locale: 'es-PE', decimals: 2 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', locale: 'pt-BR', decimals: 2 },
}

export function getCurrencyList() {
  return Object.entries(CURRENCIES).map(([code, info]) => ({ code, ...info }))
}

export function getCurrencyInfo(code) {
  return CURRENCIES[code] || CURRENCIES.MXN
}

export function formatCurrency(amount, currencyCode = 'MXN', rates = null) {
  const info = getCurrencyInfo(currencyCode)
  const value = convertCurrency(amount, currencyCode, currencyCode, rates)
  try {
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    }).format(value)
  } catch {
    return `${info.symbol}${value.toFixed(info.decimals)}`
  }
}

export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  return convert(amount, fromCurrency, toCurrency, rates)
}

export async function fetchExchangeRates(baseCurrency = 'MXN') {
  return initRateService(baseCurrency)
}

export async function getBranchCurrency(branchId) {
  if (!branchId) return 'MXN'
  try {
    const { data } = await supabase
      .from('branches')
      .select('currency')
      .eq('id', branchId)
      .single()
    return data?.currency || 'MXN'
  } catch {
    return 'MXN'
  }
}

export async function updateBranchCurrency(branchId, currencyCode) {
  if (!branchId) throw new Error('Branch ID required')
  const { error } = await supabase
    .from('branches')
    .update({ currency: currencyCode })
    .eq('id', branchId)
  if (error) throw error
  changeBaseCurrency(currencyCode)
  return currencyCode
}

export async function getConsolidatedReport(orders, targetCurrency, rates) {
  if (!orders || orders.length === 0) return []
  const r = rates || getCurrentRates()
  return orders.map((order) => ({
    ...order,
    original_amount: order.total_amount || 0,
    original_currency: order.currency || 'MXN',
    converted_amount: convertCurrency(order.total_amount || 0, order.currency || 'MXN', targetCurrency, r),
    target_currency: targetCurrency,
  }))
}

export async function getBranchCurrencyMapping(branchIds) {
  if (!branchIds || branchIds.length === 0) return {}
  try {
    const { data } = await supabase
      .from('branches')
      .select('id, currency')
      .in('id', branchIds)
    const map = {}
    ;(data || []).forEach((b) => { map[b.id] = b.currency || 'MXN' })
    return map
  } catch {
    const map = {}
    branchIds.forEach((id) => { map[id] = 'MXN' })
    return map
  }
}
