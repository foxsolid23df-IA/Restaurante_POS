import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useBusinessStore } from './useBusinessSettings'

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
      const settings = useBusinessStore.getState().settings
      const dailyLimit = settings?.daily_points_limit || 1000
      
      // Check total points earned today
      const today = new Date().toISOString().split('T')[0]
      const { data: todayTx } = await supabase
        .from('loyalty_transactions')
        .select('points')
        .eq('customer_id', customerId)
        .eq('transaction_type', 'earn')
        .gte('created_at', today + 'T00:00:00')

      const pointsToday = (todayTx || []).reduce((sum, tx) => sum + tx.points, 0)
      const isSuspicious = (pointsToday + points) > dailyLimit

      // 1. Insert transaction
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert([{
          customer_id: customerId,
          points,
          transaction_type: 'earn',
          description,
          order_id: orderId,
          is_suspicious: isSuspicious,
          alert_reason: isSuspicious ? `Excede límite diario de ${dailyLimit} pts (Total hoy: ${pointsToday + points})` : null
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

  const getAllTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          customers(name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error getting all transactions:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const adjustPoints = useCallback(async (customerId, points, type, description) => {
    setLoading(true)
    try {
      // 1. Obtener puntos actuales
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single()

      if (fetchError) throw fetchError

      const currentPoints = customer.loyalty_points || 0
      const amount = Math.abs(points)
      const newPoints = (type === 'earn' || (type === 'adjust' && points > 0))
        ? currentPoints + amount
        : currentPoints - amount

      // 2. Registrar transacción
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert([{
          customer_id: customerId,
          points: type === 'redeem' ? -amount : amount,
          transaction_type: type,
          description: description
        }])

      if (txError) throw txError

      // 3. Actualizar cliente
      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: Math.max(0, newPoints) })
        .eq('id', customerId)

      if (updateError) throw updateError

      return true
    } catch (err) {
      console.error('Error adjusting points:', err)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

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
