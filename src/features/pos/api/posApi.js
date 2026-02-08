import { supabase } from '@/lib/supabase'

export const posApi = {
    getCategories: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*, menus(*)')
            .order('name')
        if (error) throw error
        return data
    },

    getProducts: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name')
        if (error) throw error
        return data
    },

    getTables: async () => {
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('name')
        if (error) throw error
        return data
    }
}
