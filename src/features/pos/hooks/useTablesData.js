import { useSuspenseQuery } from '@tanstack/react-query'
import { tablesApi } from '../api/tablesApi'
import { useBranchStore } from '@/store/branchStore'

export const useTablesData = () => {
    const { currentBranch } = useBranchStore()
    const branchId = currentBranch?.id || null

    const layoutQuery = useSuspenseQuery({
        queryKey: ['salon-layout', branchId],
        queryFn: () => tablesApi.getLayout(branchId),
        refetchInterval: 10000
    })

    const layout = layoutQuery.data || { areas: [], tables: [], metrics: {} }

    return {
        areas: layout.areas,
        tables: layout.tables,
        metrics: {
            total: layout.metrics?.total || layout.tables.length,
            occupied: layout.metrics?.occupied || layout.tables.filter(t => t.status === 'occupied').length,
            reserved: layout.metrics?.reserved || layout.tables.filter(t => t.status === 'reserved').length,
            free: layout.metrics?.available || layout.tables.filter(t => t.status === 'available').length,
            maintenance: layout.metrics?.maintenance || layout.tables.filter(t => t.status === 'maintenance').length,
            totalCapacity: layout.metrics?.totalCapacity || 0,
            occupiedCapacity: layout.metrics?.occupiedCapacity || 0,
            utilizationRate: layout.metrics?.utilizationRate || 0
        },
        branchId,
        refetch: layoutQuery.refetch
    }
}
