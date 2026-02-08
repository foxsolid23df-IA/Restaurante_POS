import { useSuspenseQuery } from '@tanstack/react-query'
import { posApi } from '../api/posApi'

const isMenuSectionActive = (menu) => {
    if (!menu) return true
    if (!menu.is_active) return false

    const now = new Date()
    const currentDay = now.getDay()
    const currentTimeStr = now.toTimeString().split(' ')[0]

    if (menu.active_days && !menu.active_days.includes(currentDay)) return false

    if (menu.start_time && menu.end_time) {
        if (menu.start_time < menu.end_time) {
            return currentTimeStr >= menu.start_time && currentTimeStr <= menu.end_time
        } else {
            return currentTimeStr >= menu.start_time || currentTimeStr <= menu.end_time
        }
    }
    return true
}

export const usePOSData = () => {
    const categoriesQuery = useSuspenseQuery({
        queryKey: ['categories'],
        queryFn: posApi.getCategories,
        select: (data) => data.filter(cat => isMenuSectionActive(cat.menus))
    })

    const productsQuery = useSuspenseQuery({
        queryKey: ['products'],
        queryFn: posApi.getProducts
    })

    const tablesQuery = useSuspenseQuery({
        queryKey: ['tables'],
        queryFn: posApi.getTables
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
