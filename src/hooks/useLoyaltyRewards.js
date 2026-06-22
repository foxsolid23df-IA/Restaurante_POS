import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { crmApi } from '@/features/crm/api/crmApi'
import { useBranchStore } from '@/store/branchStore'

export function useLoyaltyRewards() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentBranch } = useBranchStore()

  const fetchRewards = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const rows = await crmApi.getRewards(currentBranch?.id)
      setRewards(rows)
      return rows
    } catch (err) {
      console.error('Error fetching rewards:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const saveReward = useCallback(async (rewardData) => {
    setLoading(true)
    setError(null)

    try {
      const data = await crmApi.saveReward(rewardData, currentBranch?.id)
      setRewards((prev) => {
        const exists = prev.some((reward) => reward.id === data.id)
        return exists
          ? prev.map((reward) => (reward.id === data.id ? data : reward))
          : [...prev, data]
      })
      toast.success(rewardData.id ? 'Recompensa actualizada' : 'Nueva recompensa agregada')
      return data
    } catch (err) {
      console.error('Error saving reward:', err)
      setError(err.message)
      toast.error(err.message || 'No se pudo guardar la recompensa')
      throw err
    } finally {
      setLoading(false)
    }
  }, [currentBranch?.id])

  const deleteReward = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      await crmApi.deleteReward(id)
      setRewards((prev) => prev.filter((reward) => reward.id !== id))
      toast.success('Recompensa desactivada')
    } catch (err) {
      console.error('Error deleting reward:', err)
      setError(err.message)
      toast.error(err.message || 'No se pudo desactivar')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  return {
    rewards,
    loading,
    error,
    fetchRewards,
    saveReward,
    deleteReward
  }
}
