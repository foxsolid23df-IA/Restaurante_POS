import { salonApi } from '@/features/salon/api/salonApi'

export const tablesApi = {
    getLayout: async (branchId) => {
        return salonApi.getLayout(branchId)
    },

    getAreas: async (branchId) => {
        const layout = await salonApi.getLayout(branchId)
        return layout.areas
    },

    getTables: async (branchId) => {
        const layout = await salonApi.getLayout(branchId)
        return layout.tables
    },

    getOrderDetails: async (orderId) => {
        return salonApi.getOrderDetails(orderId)
    }
}
