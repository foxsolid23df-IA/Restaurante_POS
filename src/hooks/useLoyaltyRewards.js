import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useLoyaltyRewards() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRewards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('points_cost', { ascending: true })

      if (error) throw error
      setRewards(data || [])
    } catch (err) {
      console.error('Error fetching rewards:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveReward = useCallback(async (rewardData) => {
    setLoading(true)
    try {
      const isEditing = !!rewardData.id
      const query = isEditing
        ? supabase.from('loyalty_rewards').update(rewardData).eq('id', rewardData.id)
        : supabase.from('loyalty_rewards').insert([rewardData])

      const { data, error } = await query.select().single()

      if (error) throw error
      
      if (isEditing) {
        setRewards(prev => prev.map(r => r.id === data.id ? data : r))
        toast.success('Recompensa actualizada')
      } else {
        setRewards(prev => [...prev, data])
        toast.success('Nueva recompensa añadida')
      }
      return data
    } catch (err) {
      console.error('Error saving reward:', err)
      toast.error('No se pudo guardar la recompensa')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteReward = useCallback(async (id) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id)

      if (error) throw error
      setRewards(prev => prev.filter(r => r.id !== id))
      toast.success('Recompensa eliminada')
    } catch (err) {
      console.error('Error deleting reward:', err)
      toast.error('No se pudo eliminar')
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
