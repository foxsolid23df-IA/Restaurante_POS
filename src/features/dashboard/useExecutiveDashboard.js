import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchExecutiveDashboard, invalidateDashboardCache } from './dashboardEngine'

const REFRESH_INTERVAL = 60000

export function useExecutiveDashboard(branchId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const load = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchExecutiveDashboard(branchId)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    load()

    intervalRef.current = setInterval(load, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [load])

  const refresh = useCallback(() => {
    if (branchId) invalidateDashboardCache(branchId)
    load()
  }, [branchId, load])

  return { data, loading, error, refresh }
}
