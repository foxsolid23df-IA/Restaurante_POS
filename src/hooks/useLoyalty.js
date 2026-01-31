import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useLoyalty() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getPointsHistory = useCallback(async (customerId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error getting loyalty history:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const addPoints = useCallback(async (customerId, points, description, orderId = null) => {
    setLoading(true)
    try {
      // 1. Insert transaction
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert([{
          customer_id: customerId,
          points,
          transaction_type: 'earn',
          description,
          order_id: orderId
        }])

      if (txError) throw txError

      // 2. Update customer balance
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single()

      if (custError) throw custError

      const newTotal = (customer.loyalty_points || 0) + points

      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newTotal })
        .eq('id', customerId)

      if (updateError) throw updateError

      return newTotal
    } catch (err) {
      console.error('Error adding loyalty points:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const redeemPoints = useCallback(async (customerId, points, description, orderId = null) => {
    setLoading(true)
    try {
      // Check balance first
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single()

      if (custError) throw custError
      if (customer.loyalty_points < points) {
        throw new Error('Puntos insuficientes')
      }

      // 1. Insert transaction
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert([{
          customer_id: customerId,
          points: -points,
          transaction_type: 'redeem',
          description,
          order_id: orderId
        }])

      if (txError) throw txError

      // 2. Update customer balance
      const newTotal = customer.loyalty_points - points

      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newTotal })
        .eq('id', customerId)

      if (updateError) throw updateError

      return newTotal
    } catch (err) {
      console.error('Error redeeming loyalty points:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getPointsHistory,
    addPoints,
    redeemPoints
  }
}

export default useLoyalty
