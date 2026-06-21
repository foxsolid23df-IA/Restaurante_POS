import { useSuspenseQuery } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'

export const useDashboardStats = (branchId) => {
    const query = useSuspenseQuery({
        queryKey: ['operationalDashboard', branchId || 'all'],
        queryFn: () => adminApi.getOperationalDashboard({ branchId }),
        refetchInterval: 60000 // Refresh every minute
    })

    return {
        stats: query.data,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        refetch: query.refetch
    }
}
