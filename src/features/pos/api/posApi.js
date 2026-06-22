import { supabase } from '@/lib/supabase'
import { catalogApi } from '@/features/catalog/api/catalogApi'
import { salonApi } from '@/features/salon/api/salonApi'

export const posApi = {
    getCategories: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*, menus(*)')
            .order('name')
        if (error) throw error
        return catalogApi.filterCategoriesForPOS(data)
    },

    getProducts: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(id, name, menu_id, menus(*)), product_recipes(id, inventory_item_id, quantity_required, wastage_percentage, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit))')
            .eq('is_active', true)
            .order('name')

        if (error && String(error.message || '').includes('wastage_percentage')) {
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('products')
                .select('*, categories(id, name, menu_id, menus(*)), product_recipes(id, inventory_item_id, quantity_required, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit))')
                .eq('is_active', true)
                .order('name')

            if (fallbackError) throw fallbackError
            return catalogApi.filterProductsForPOS(fallbackData)
        }

        if (error) throw error
        return catalogApi.filterProductsForPOS(data)
    },

    getTables: async (branchId) => {
        const layout = await salonApi.getLayout(branchId)
        return layout.tables
    }
}
