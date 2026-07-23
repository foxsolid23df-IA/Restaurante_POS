import { useMemo } from 'react'

export function useCustomerAnalytics(customers = [], orders = []) {
  return useMemo(() => {
    const customerById = new Map(customers.map((customer) => [customer.id, customer]))

    // 1. Total lifetime value (LTV)
    const totalLTV = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    
    // 2. Average Order Value (AOV)
    const aov = orders.length > 0 ? totalLTV / orders.length : 0

    // 3. Customer Retention (Rough estimate: customers with > 1 order)
    const customerOrderCounts = orders.reduce((acc, order) => {
      const customerKey = order.customer_id || order.customer_info?.email || order.customer_info?.phone
      if (customerKey) acc[customerKey] = (acc[customerKey] || 0) + 1
      return acc
    }, {})

    const returningCustomersCount = Object.values(customerOrderCounts).filter(count => count > 1).length
    const totalWithData = Object.keys(customerOrderCounts).length
    const retentionRate = totalWithData > 0 ? (returningCustomersCount / totalWithData) * 100 : 0

    // 4. Top Spenders
    const customerSpending = orders.reduce((acc, order) => {
      const customerKey = order.customer_id || order.customer_info?.email || order.customer_info?.phone
      if (customerKey) acc[customerKey] = (acc[customerKey] || 0) + (order.total_amount || 0)
      return acc
    }, {})

    const topSpenders = Object.entries(customerSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([customerKey, amount]) => [
        customerById.get(customerKey)?.name || customerKey,
        amount
      ])

    return {
      totalLTV,
      aov,
      retentionRate,
      topSpenders,
      totalCustomers: customers.length
    }
  }, [customers, orders])
}
