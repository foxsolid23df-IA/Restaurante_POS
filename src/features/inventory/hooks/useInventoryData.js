import { useSuspenseQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventoryApi'

export const useInventoryData = (branchId) => {
    const query = useSuspenseQuery({
        queryKey: ['inventory', branchId],
        queryFn: () => inventoryApi.getInventoryItems(branchId),
        enabled: !!branchId
    })

    return {
        items: query.data,
        criticalItems: query.data.filter(item => parseFloat(item.current_stock) <= parseFloat(item.min_stock))
    }
}
