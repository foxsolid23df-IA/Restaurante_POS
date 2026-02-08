import { useSuspenseQuery } from '@tanstack/react-query'
import { tablesApi } from '../api/tablesApi'

export const useTablesData = () => {
    const areasQuery = useSuspenseQuery({
        queryKey: ['areas'],
        queryFn: tablesApi.getAreas
    })

    const tablesQuery = useSuspenseQuery({
        queryKey: ['tables'],
        queryFn: tablesApi.getTables,
        refetchInterval: 10000 // Polling every 10s for real-time status
    })

    return {
        areas: areasQuery.data,
        tables: tablesQuery.data,
        metrics: {
            total: tablesQuery.data.length,
            occupied: tablesQuery.data.filter(t => t.status === 'occupied').length,
            reserved: tablesQuery.data.filter(t => t.status === 'reserved').length,
            free: tablesQuery.data.filter(t => t.status === 'available').length
        }
    }
}
