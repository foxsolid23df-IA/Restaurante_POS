import { supabase } from '@/lib/supabase'

export const tablesApi = {
    getAreas: async () => {
        const { data, error } = await supabase
            .from('areas')
            .select('*')
            .order('name')
        if (error) throw error
        return data
    },

    getTables: async () => {
        const { data, error } = await supabase
            .from('tables')
            .select('*, areas(name)')
            .order('name')
        if (error) throw error
        return data
    },

    getOrderDetails: async (orderId) => {
        if (!orderId) return null
        const { data, error } = await supabase
            .from('order_items')
            .select('*, products(name, price)')
            .eq('order_id', orderId)
        if (error) throw error
        return data
    }
}
