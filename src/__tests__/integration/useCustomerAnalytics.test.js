import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCustomerAnalytics } from '@/hooks/useCustomerAnalytics'

describe('useCustomerAnalytics - Unit', () => {
  it('should return zero values for empty data', () => {
    const { result } = renderHook(() => useCustomerAnalytics([], []))
    
    expect(result.current.totalLTV).toBe(0)
    expect(result.current.aov).toBe(0)
    expect(result.current.retentionRate).toBe(0)
    expect(result.current.totalCustomers).toBe(0)
    expect(result.current.topSpenders).toEqual([])
  })

  it('should calculate total LTV correctly', () => {
    const customers = [{ id: 'c1', name: 'Juan' }]
    const orders = [
      { customer_id: 'c1', total_amount: 100 },
      { customer_id: 'c1', total_amount: 200 },
    ]

    const { result } = renderHook(() => useCustomerAnalytics(customers, orders))
    expect(result.current.totalLTV).toBe(300)
  })

  it('should calculate AOV correctly', () => {
    const customers = [{ id: 'c1', name: 'Juan' }]
    const orders = [
      { customer_id: 'c1', total_amount: 100 },
      { customer_id: 'c1', total_amount: 200 },
    ]

    const { result } = renderHook(() => useCustomerAnalytics(customers, orders))
    expect(result.current.aov).toBe(150)
  })

  it('should calculate retention rate correctly', () => {
    const customers = [
      { id: 'c1', name: 'Juan' },
      { id: 'c2', name: 'Maria' },
    ]
    const orders = [
      { customer_id: 'c1', total_amount: 100 },
      { customer_id: 'c1', total_amount: 200 },
      { customer_id: 'c2', total_amount: 150 },
    ]

    const { result } = renderHook(() => useCustomerAnalytics(customers, orders))
    expect(result.current.retentionRate).toBe(50)
  })

  it('should identify top spenders', () => {
    const customers = [
      { id: 'c1', name: 'Juan' },
      { id: 'c2', name: 'Maria' },
    ]
    const orders = [
      { customer_id: 'c1', total_amount: 100 },
      { customer_id: 'c2', total_amount: 300 },
    ]

    const { result } = renderHook(() => useCustomerAnalytics(customers, orders))
    expect(result.current.topSpenders[0]).toEqual(['Maria', 300])
    expect(result.current.topSpenders[1]).toEqual(['Juan', 100])
  })

  it('should count total customers', () => {
    const customers = [
      { id: 'c1', name: 'Juan' },
      { id: 'c2', name: 'Maria' },
      { id: 'c3', name: 'Pedro' },
    ]

    const { result } = renderHook(() => useCustomerAnalytics(customers, []))
    expect(result.current.totalCustomers).toBe(3)
  })
})
