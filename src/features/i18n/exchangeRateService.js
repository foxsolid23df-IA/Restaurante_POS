const RATES_STORAGE_KEY = 'pos_exchange_rates'
const DEFAULT_REFRESH_INTERVAL = 30 * 60 * 1000
const RATES_EXPIRY = 4 * 60 * 60 * 1000

const FALLBACK_RATES = {
  MXN: 1, USD: 0.058, EUR: 0.054, COP: 237, ARS: 52,
  CLP: 54, PEN: 0.22, BRL: 0.32,
}

let currentBase = 'MXN'
let currentRates = null
let lastFetch = 0
let refreshTimer = null
let listeners = new Set()

function getCached() {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > RATES_EXPIRY) return null
    return parsed
  } catch {
    return null
  }
}

function persistRates(rates) {
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ rates, timestamp: Date.now(), base: currentBase }))
  } catch {}
}

async function fetchFreshRates() {
  try {
    const resp = await fetch(`https://api.exchangerate-api.com/v4/latest/${currentBase}`)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    currentRates = data.rates || FALLBACK_RATES
    lastFetch = Date.now()
    persistRates(currentRates)
    return currentRates
  } catch {
    currentRates = getCached()?.rates || FALLBACK_RATES
    lastFetch = Date.now()
    return currentRates
  }
}

function notify() {
  listeners.forEach((cb) => cb(currentRates, lastFetch))
}

export async function initRateService(baseCurrency = 'MXN') {
  currentBase = baseCurrency
  const cached = getCached()
  if (cached) {
    currentRates = cached.rates
    lastFetch = cached.timestamp || Date.now()
  }
  await fetchFreshRates()
  notify()
  scheduleRefresh()
  return currentRates
}

function scheduleRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(async () => {
    await fetchFreshRates()
    notify()
  }, DEFAULT_REFRESH_INTERVAL)
}

export function stopRateService() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

export function changeBaseCurrency(newBase) {
  if (newBase === currentBase) return
  currentBase = newBase
  fetchFreshRates().then(notify)
  scheduleRefresh()
}

export function subscribeRates(cb) {
  listeners.add(cb)
  if (currentRates) cb(currentRates, lastFetch)
  return () => listeners.delete(cb)
}

export function getCurrentRates() {
  return currentRates || FALLBACK_RATES
}

export function getLastFetchTime() {
  return lastFetch
}

export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount
  const r = rates || currentRates || FALLBACK_RATES
  const fromRate = r[fromCurrency] || 1
  const toRate = r[toCurrency] || 1
  if (fromRate === 0 || toRate === 0) return amount
  return (amount / fromRate) * toRate
}
