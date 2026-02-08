import { useSuspenseQuery } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'

export const useDashboardStats = () => {
    const query = useSuspenseQuery({
        queryKey: ['dashboardStats'],
        queryFn: adminApi.getStats,
        refetchInterval: 60000 // Refresh every minute
    })

    return {
        stats: query.data,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        refetch: query.refetch
    }
}
