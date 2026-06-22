import { useSuspenseQuery } from '@tanstack/react-query'
import { posApi } from '../api/posApi'
import { useBranchStore } from '@/store/branchStore'

export const usePOSData = () => {
    const { currentBranch } = useBranchStore()
    const branchId = currentBranch?.id || null

    const categoriesQuery = useSuspenseQuery({
        queryKey: ['categories'],
        queryFn: posApi.getCategories
    })

    const productsQuery = useSuspenseQuery({
        queryKey: ['products'],
        queryFn: posApi.getProducts
    })

    const tablesQuery = useSuspenseQuery({
        queryKey: ['pos-tables', branchId],
        queryFn: () => posApi.getTables(branchId)
    })

    return {
        categories: categoriesQuery.data,
        products: productsQuery.data,
        tables: tablesQuery.data,
        refetch: () => {
            categoriesQuery.refetch()
            productsQuery.refetch()
            tablesQuery.refetch()
        }
    }
}
