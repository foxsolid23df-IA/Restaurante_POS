import { useMemo } from 'react'
import { useCustomers } from './useCustomers'
import { useOrders } from './useOrders'

export function useCustomerAnalytics() {
  const { customers } = useCustomers()
  const { orders } = useOrders()

  return useMemo(() => {
    // 1. Total lifetime value (LTV)
    const totalLTV = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    
    // 2. Average Order Value (AOV)
    const aov = orders.length > 0 ? totalLTV / orders.length : 0

    // 3. Customer Retention (Rough estimate: customers with > 1 order)
    const customerOrderCounts = orders.reduce((acc, order) => {
      const email = order.customer_info?.email
      if (email) acc[email] = (acc[email] || 0) + 1
      return acc
    }, {})

    const returningCustomersCount = Object.values(customerOrderCounts).filter(count => count > 1).length
    const totalWithData = Object.keys(customerOrderCounts).length
    const retentionRate = totalWithData > 0 ? (returningCustomersCount / totalWithData) * 100 : 0

    // 4. Top Spenders
    const customerSpending = orders.reduce((acc, order) => {
      const email = order.customer_info?.email
      if (email) acc[email] = (acc[email] || 0) + (order.total_amount || 0)
      return acc
    }, {})

    const topSpenders = Object.entries(customerSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    return {
      totalLTV,
      aov,
      retentionRate,
      topSpenders,
      totalCustomers: customers.length
    }
  }, [customers, orders])
}
