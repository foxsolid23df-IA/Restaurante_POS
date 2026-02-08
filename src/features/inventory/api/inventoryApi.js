import { supabase } from '@/lib/supabase'

export const inventoryApi = {
    getInventoryItems: async (branchId) => {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('branch_id', branchId)
            .order('name')
        if (error) throw error
        return data
    },

    deleteItem: async (itemId) => {
        const { error } = await supabase.from('inventory_items').delete().eq('id', itemId)
        if (error) throw error
    }
}
