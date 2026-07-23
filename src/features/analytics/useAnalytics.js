import { useState, useCallback } from 'react'
import { analyticsApi } from './api/analyticsApi'

export function useAnalytics(branchId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runQuery = useCallback(async (queryFn) => {
    setLoading(true)
    setError(null)
    try {
      const result = await queryFn()
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar analytics'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getForecast = useCallback(
    (daysToPredict = 14, historicalDays = 60) => runQuery(() => analyticsApi.getSalesForecast(branchId, daysToPredict, historicalDays)),
    [branchId, runQuery]
  )

  const getRecommendations = useCallback(
    (customerId) => runQuery(() => analyticsApi.getProductRecommendations(branchId, customerId)),
    [branchId, runQuery]
  )

  const getAnomalies = useCallback(
    (days = 30) => runQuery(() => analyticsApi.getAnomalyDetection(branchId, days)),
    [branchId, runQuery]
  )

  const getSegmentation = useCallback(
    () => runQuery(() => analyticsApi.getCustomerSegmentation(branchId)),
    [branchId, runQuery]
  )

  const getTopProducts = useCallback(
    (metric = 'quantity', limit = 10, days = 30) => runQuery(() => analyticsApi.getTopProducts(branchId, metric, limit, days)),
    [branchId, runQuery]
  )

  const getBusiestHours = useCallback(
    (days = 30) => runQuery(() => analyticsApi.getBusiestHours(branchId, days)),
    [branchId, runQuery]
  )

  const getDayOverDay = useCallback(
    () => runQuery(() => analyticsApi.getDayOverDayComparison(branchId)),
    [branchId, runQuery]
  )

  return {
    loading,
    error,
    getForecast,
    getRecommendations,
    getAnomalies,
    getSegmentation,
    getTopProducts,
    getBusiestHours,
    getDayOverDay,
  }
}
