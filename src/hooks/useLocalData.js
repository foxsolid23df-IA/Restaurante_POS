import { useState, useEffect, useCallback } from 'react'
import { localDb } from '@/lib/localDb'
import { isElectron } from '@/lib/electronBridge'
import { useBranchStore } from '@/store/branchStore'
import useOfflineStore from '@/store/offlineStore'

function useLocalQuery(key, fetcher, options = {}) {
  const { enabled = true } = options
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const branchId = useBranchStore((s) => s.currentBranch?.id)
  const isOnline = useOfflineStore((s) => s.isOnline)

  const fetch = useCallback(async () => {
    if (!isElectron || !enabled) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher({ branchId, isOnline })
      setData(result)
    } catch (err) {
      setError(err)
      console.error(`useLocalQuery [${key}]:`, err)
    } finally {
      setIsLoading(false)
    }
  }, [key, branchId, isOnline, enabled])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}

export function useLocalOrders(filters = {}) {
  return useLocalQuery('orders', async ({ branchId }) => {
    return localDb.getOrders(branchId, filters)
  })
}

export function useLocalProducts(categoryId = null) {
  return useLocalQuery(`products-${categoryId}`, async ({ branchId }) => {
    return localDb.getProducts(branchId, categoryId)
  })
}

export function useLocalCategories() {
  return useLocalQuery('categories', async ({ branchId }) => {
    return localDb.getCategories(branchId)
  })
}

export function useLocalTables() {
  return useLocalQuery('tables', async ({ branchId }) => {
    return localDb.getTables(branchId)
  })
}

export function useLocalSettings() {
  return useLocalQuery('settings', async () => {
    return localDb.getSettings()
  })
}

export function useLocalOrder(orderId) {
  return useLocalQuery(`order-${orderId}`, async () => {
    if (!orderId) return null
    return localDb.getOrder(orderId)
  })
}

export function useLocalCustomers(search = '') {
  return useLocalQuery(`customers-${search}`, async ({ branchId }) => {
    return localDb.getCustomers(branchId, search)
  })
}

export function useLocalSyncStatus() {
  const { pendingChanges, lastSyncAt, isSyncing, triggerSync } = useOfflineStore()

  useEffect(() => {
    if (isElectron) {
      useOfflineStore.getState().refreshSyncStatus()
      useOfflineStore.getState().startAutoSync()
    }
    return () => {
      if (isElectron) {
        useOfflineStore.getState().stopAutoSync()
      }
    }
  }, [])

  return { pendingChanges, lastSyncAt, isSyncing, triggerSync }
}

export default useLocalQuery
