import { useState, useCallback } from 'react'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

export function useLoyalty() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const run = useCallback(async (operation) => {
    setLoading(true)
    setError(null)
    try {
      return await operation()
    } catch (err) {
      console.error('Error in loyalty operation:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getPointsHistory = useCallback((customerId) => (
    run(() => crmApi.getLoyaltyTransactions(customerId))
  ), [run])

  const addPoints = useCallback((customerId, points, description) => (
    run(() => crmApi.adjustLoyaltyPoints({
      customerId,
      points: Math.abs(Number(points)),
      type: 'earn',
      description
    }))
  ), [run])

  const redeemPoints = useCallback((customerId, points, description) => (
    run(() => crmApi.adjustLoyaltyPoints({
      customerId,
      points: Math.abs(Number(points)),
      type: 'redeem',
      description
    }))
  ), [run])

  const adjustPoints = useCallback(async (customerId, points, type, description) => {
    try {
      await run(() => crmApi.adjustLoyaltyPoints({
        customerId,
        points: Number(points),
        type,
        description
      }))
      return true
    } catch {
      return false
    }
  }, [run])

  const getAllTransactions = useCallback(() => (
    run(() => crmApi.getAllLoyaltyTransactions(currentBranch?.id))
  ), [run, currentBranch?.id])

  return {
    loading,
    error,
    getPointsHistory,
    getTransactions: getPointsHistory,
    addPoints,
    redeemPoints,
    adjustPoints,
    getAllTransactions
  }
}

export default useLoyalty
