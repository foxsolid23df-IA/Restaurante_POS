import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateRFM, getSegmentStats, RFM_SEGMENTS } from '@/features/analytics/customerSegmentation'

describe('customerSegmentation - Unit', () => {
  describe('calculateRFM', () => {
    it('should return empty array for empty orders', () => {
      const result = calculateRFM([])
      expect(result).toEqual([])
    })

    it('should calculate RFM for a single customer with one order', () => {
      const orders = [
        { customer_id: 'cust-1', total_amount: 500, created_at: new Date().toISOString() }
      ]
      const result = calculateRFM(orders)
      
      expect(result).toHaveLength(1)
      expect(result[0].customerId).toBe('cust-1')
      expect(result[0].totalSpent).toBe(500)
      expect(result[0].orderCount).toBe(1)
    })

    it('should aggregate multiple orders for the same customer', () => {
      const now = new Date()
      const orders = [
        { customer_id: 'cust-1', total_amount: 300, created_at: now.toISOString() },
        { customer_id: 'cust-1', total_amount: 200, created_at: now.toISOString() },
        { customer_id: 'cust-1', total_amount: 150, created_at: now.toISOString() },
      ]
      const result = calculateRFM(orders)
      
      expect(result).toHaveLength(1)
      expect(result[0].totalSpent).toBe(650)
      expect(result[0].orderCount).toBe(3)
    })

    it('should segment champion customers correctly', () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 10 * 86400000).toISOString()
      
      const orders = Array.from({ length: 6 }, (_, i) => ({
        customer_id: 'cust-1',
        total_amount: 1000,
        created_at: recentDate
      }))
      
      const result = calculateRFM(orders)
      expect(result[0].segment).toBe('champions')
    })

    it('should segment new customers correctly', () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 5 * 86400000).toISOString()
      
      const orders = [
        { customer_id: 'cust-new', total_amount: 100, created_at: recentDate }
      ]
      
      const result = calculateRFM(orders)
      expect(result[0].segment).toBe('new')
    })

    it('should segment at-risk customers correctly', () => {
      const now = new Date()
      const oldDate = new Date(now.getTime() - 120 * 86400000).toISOString()
      
      const orders = [
        { customer_id: 'cust-risk', total_amount: 600, created_at: oldDate },
        { customer_id: 'cust-risk', total_amount: 400, created_at: oldDate },
      ]
      
      const result = calculateRFM(orders)
      expect(result[0].segment).toBe('at_risk')
    })

    it('should segment lost customers correctly', () => {
      const now = new Date()
      const veryOldDate = new Date(now.getTime() - 200 * 86400000).toISOString()
      
      const orders = [
        { customer_id: 'cust-lost', total_amount: 100, created_at: veryOldDate }
      ]
      
      const result = calculateRFM(orders)
      expect(result[0].segment).toBe('lost')
    })

    it('should skip orders without customer_id', () => {
      const orders = [
        { customer_id: null, total_amount: 100, created_at: new Date().toISOString() },
        { total_amount: 200, created_at: new Date().toISOString() },
      ]
      
      const result = calculateRFM(orders)
      expect(result).toHaveLength(0)
    })

    it('should calculate churn probability correctly', () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 10 * 86400000).toISOString()
      const oldDate = new Date(now.getTime() - 150 * 86400000).toISOString()
      
      const orders = [
        { customer_id: 'cust-recent', total_amount: 100, created_at: recentDate },
        { customer_id: 'cust-old', total_amount: 100, created_at: oldDate },
      ]
      
      const result = calculateRFM(orders)
      const recentCustomer = result.find(c => c.customerId === 'cust-recent')
      const oldCustomer = result.find(c => c.customerId === 'cust-old')
      
      expect(recentCustomer.churnProbability).toBeLessThan(oldCustomer.churnProbability)
    })

    it('should sort by RFM score descending', () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 5 * 86400000).toISOString()
      
      const orders = [
        { customer_id: 'cust-low', total_amount: 50, created_at: recentDate },
        { customer_id: 'cust-high', total_amount: 5000, created_at: recentDate },
      ]
      
      const result = calculateRFM(orders)
      expect(result[0].customerId).toBe('cust-high')
      expect(result[1].customerId).toBe('cust-low')
    })
  })

  describe('getSegmentStats', () => {
    it('should return empty array for empty segments', () => {
      const result = getSegmentStats([])
      expect(result).toEqual([])
    })

    it('should aggregate stats by segment', () => {
      const segments = [
        { segment: 'champions', totalSpent: 1000, orderCount: 5, customerId: 'cust-1' },
        { segment: 'champions', totalSpent: 2000, orderCount: 8, customerId: 'cust-2' },
        { segment: 'new', totalSpent: 100, orderCount: 1, customerId: 'cust-3' },
      ]
      
      const result = getSegmentStats(segments)
      expect(result).toHaveLength(2)
      
      const champions = result.find(s => s.segment === 'champions')
      expect(champions.count).toBe(2)
      expect(champions.totalSpent).toBe(3000)
      expect(champions.averageSpent).toBe(1500)
      expect(champions.percentage).toBeCloseTo(66.67, 0)
    })

    it('should include label and color from RFM_SEGMENTS', () => {
      const segments = [
        { segment: 'champions', totalSpent: 1000, orderCount: 5, customerId: 'cust-1' },
      ]
      
      const result = getSegmentStats(segments)
      expect(result[0].label).toBe(RFM_SEGMENTS.CHAMPIONS.name)
      expect(result[0].color).toBe(RFM_SEGMENTS.CHAMPIONS.color)
    })

    it('should handle unknown segments gracefully', () => {
      const segments = [
        { segment: 'unknown', totalSpent: 100, orderCount: 1, customerId: 'cust-1' },
      ]
      
      const result = getSegmentStats(segments)
      expect(result[0].label).toBe('unknown')
      expect(result[0].color).toBe('#94a3b8')
    })
  })
})
