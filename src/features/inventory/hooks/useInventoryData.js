import { useSuspenseQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventoryApi'

export const useInventoryData = (branchId, filters = {}) => {
    const query = useSuspenseQuery({
        queryKey: ['inventory', branchId, filters],
        queryFn: () => inventoryApi.getInventoryItems(branchId, filters)
    })

    const dashboardQuery = useSuspenseQuery({
        queryKey: ['inventory-dashboard', branchId],
        queryFn: () => inventoryApi.getDashboard(branchId)
    })

    const alertsQuery = useSuspenseQuery({
        queryKey: ['inventory-alerts', branchId],
        queryFn: () => inventoryApi.getActiveAlerts(branchId)
    })

    return {
        items: query.data,
        criticalItems: query.data.filter(item => item.stockStatus === 'critical'),
        dashboard: dashboardQuery.data,
        alerts: alertsQuery.data,
        isFetching: query.isFetching || dashboardQuery.isFetching || alertsQuery.isFetching
    }
}
