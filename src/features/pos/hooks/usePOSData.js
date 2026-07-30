import { useSuspenseQuery } from '@tanstack/react-query'
import { posApi } from '../api/posApi'
import { useBranchStore } from '@/store/branchStore'

export const usePOSData = (selectedMenu = 'auto') => {
    const { currentBranch } = useBranchStore()
    const branchId = currentBranch?.id || null

    const categoriesQuery = useSuspenseQuery({
        queryKey: ['categories', branchId, selectedMenu],
        queryFn: () => posApi.getCategories({ branchId, menuId: selectedMenu }),
        staleTime: 1000 * 60 * 2,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    })

    const productsQuery = useSuspenseQuery({
        queryKey: ['products', branchId, selectedMenu],
        queryFn: () => posApi.getProducts({ branchId, menuId: selectedMenu }),
        staleTime: 1000 * 60 * 2,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    })

    const menusQuery = useSuspenseQuery({
        queryKey: ['pos-menus', branchId],
        queryFn: () => posApi.getMenus(branchId),
        staleTime: 1000 * 60 * 2,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    })

    const tablesQuery = useSuspenseQuery({
        queryKey: ['pos-tables', branchId],
        queryFn: () => posApi.getTables(branchId),
        staleTime: 1000 * 60 * 2,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    })

    return {
        categories: categoriesQuery.data,
        products: productsQuery.data,
        menus: menusQuery.data,
        tables: tablesQuery.data,
        refetch: () => {
            categoriesQuery.refetch()
            productsQuery.refetch()
            menusQuery.refetch()
            tablesQuery.refetch()
        }
    }
}
