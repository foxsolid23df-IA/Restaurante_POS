import { supabase } from '@/lib/supabase'

export function decomposeSeasonality(data, period = 7) {
  if (data.length < period * 2) return null

  const n = data.length
  const values = data.map((d) => (typeof d === 'number' ? d : d.value))

  const trend = []
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - Math.floor(period / 2))
    const end = Math.min(n, i + Math.floor(period / 2) + 1)
    const window = values.slice(start, end)
    trend.push(window.reduce((s, v) => s + v, 0) / window.length)
  }

  const detrended = values.map((v, i) => v - trend[i])

  const seasonal = []
  for (let i = 0; i < period; i++) {
    let sum = 0, count = 0
    for (let j = i; j < n; j += period) {
      sum += detrended[j]
      count++
    }
    seasonal.push(count > 0 ? sum / count : 0)
  }

  const seasonalAvg = seasonal.reduce((s, v) => s + v, 0) / period
  const seasonalAdjusted = seasonal.map((s) => s - seasonalAvg)

  return { trend, seasonal: seasonalAdjusted, period, residual: detrended.map((d, i) => d - seasonalAdjusted[i % period]) }
}

export function forecastWithSeasonality(data, horizon = 14, period = 7) {
  const decomposition = decomposeSeasonality(data, period)
  if (!decomposition) return null

  const n = data.length
  const values = data.map((d) => (typeof d === 'number' ? d : d.value))
  const lastTrend = decomposition.trend.slice(-3)

  const trendSlope = lastTrend.length >= 2
    ? (lastTrend[lastTrend.length - 1] - lastTrend[0]) / (lastTrend.length - 1)
    : 0

  const trendRecent = decomposition.trend[decomposition.trend.length - 1] || values[values.length - 1]

  const forecasts = []
  for (let i = 0; i < horizon; i++) {
    const trendValue = trendRecent + trendSlope * (i + 1)
    const seasonalComponent = decomposition.seasonal[(n + i) % period] || 0
    const predicted = Math.max(0, trendValue + seasonalComponent)

    const error = decomposition.residual.reduce((s, r) => s + Math.abs(r), 0) / decomposition.residual.length
    const confidenceWidth = error * 1.96

    forecasts.push({
      period: n + i + 1,
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      predicted: Math.round(predicted * 100) / 100,
      lower: Math.max(0, Math.round((predicted - confidenceWidth) * 100) / 100),
      upper: Math.round((predicted + confidenceWidth) * 100) / 100,
    })
  }

  return { forecasts, decomposition }
}

export function calculateConfidenceInterval(forecasts, historicalVariance) {
  if (!forecasts || forecasts.length === 0) return null
  const predicted = forecasts.map((f) => f.predicted)
  const mean = predicted.reduce((s, v) => s + v, 0) / predicted.length
  const variance = predicted.reduce((s, v) => s + (v - mean) ** 2, 0) / predicted.length
  const stdDev = Math.sqrt(variance + historicalVariance)
  return {
    mean,
    stdDev,
    lowerBound: mean - 1.96 * stdDev,
    upperBound: mean + 1.96 * stdDev,
    confidenceScore: stdDev > 0 && mean > 0
      ? Math.max(0, Math.min(1, 1 - stdDev / mean))
      : 0.5,
  }
}

export function adjustForEvents(forecasts, events = []) {
  if (!forecasts || events.length === 0) return forecasts

  return forecasts.map((f) => {
    const matchingEvent = events.find((e) => e.date === f.date)
    if (!matchingEvent) return f

    const multiplier = 1 + (matchingEvent.impact || 0)
    return {
      ...f,
      predicted: Math.round(f.predicted * multiplier * 100) / 100,
      upper: Math.round(f.upper * multiplier * 100) / 100,
      lower: Math.round(f.lower * multiplier * 100) / 100,
      event: matchingEvent.name,
    }
  })
}

export async function fetchSeasonalForecast(branchId, options = {}) {
  const { daysHistory = 90, forecastHorizon = 14, period = 7 } = options
  const since = new Date(Date.now() - daysHistory * 86400000).toISOString()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('branch_id', branchId)
    .eq('status', 'completed')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) throw error

  const dailyMap = {}
 ;(orders || []).forEach((o) => {
    const date = o.created_at.split('T')[0]
    dailyMap[date] = (dailyMap[date] || 0) + Number(o.total_amount || 0)
  })

  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }))

  const series = dailyData.map((d) => d.value)

  if (series.length < period * 2) return null

  const result = forecastWithSeasonality(series, forecastHorizon, period)

  if (!result) return null

  const variance = series.reduce((s, v) => s + (v - series.reduce((a, b) => a + b, 0) / series.length) ** 2, 0) / series.length
  const confidence = calculateConfidenceInterval(result.forecasts, variance)

  return {
    historical: dailyData,
    ...result,
    confidence,
    totalProjected: result.forecasts.reduce((s, f) => s + f.predicted, 0),
    averageDaily: result.forecasts.reduce((s, f) => s + f.predicted, 0) / result.forecasts.length,
    trend: result.decomposition.trend[result.decomposition.trend.length - 1] - result.decomposition.trend[0],
  }
}
