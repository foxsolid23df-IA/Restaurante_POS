import { supabase } from '@/lib/supabase'
import { catalogApi } from '@/features/catalog/api/catalogApi'
import { salonApi } from '@/features/salon/api/salonApi'
import { localDb } from '@/lib/localDb'

function normalizeLocalProducts(rows) {
  return rows.map((row) => {
    const product = { ...row, categories: row.category_id ? { id: row.category_id, name: row.category_name } : null }
    if (row.local_image_path) {
      product.image_url = `file://${row.local_image_path}`
    }
    return product
  })
}

function normalizeLocalCategories(rows) {
  return rows.map((row) => ({
    ...row,
    menus: row.menu_id
      ? {
          id: row.menu_id,
          name: row.menu_name,
          start_time: row.menu_start_time,
          end_time: row.menu_end_time,
          active_days: row.menu_active_days,
          is_active: row.menu_is_active,
          branch_id: row.menu_branch_id
        }
      : null
  }))
}

export const posApi = {
    getCategories: async ({ branchId, menuId } = {}) => {
        if (localDb.canUseLocal()) {
            const rows = await localDb.getCategories(branchId, menuId)
            return normalizeLocalCategories(rows)
        }

        let query = supabase
            .from('categories')
            .select('*, menus(*)')
            .order('name')

        if (branchId) {
            query = query.or(`menu_id.is.null, menus.branch_id.is.null, menus.branch_id.eq.${branchId}`)
        }

        if (menuId && menuId !== 'auto') {
            query = query.eq('menu_id', menuId)
        }

        const { data, error } = await query
        if (error) throw error
        return catalogApi.filterCategoriesForPOS(data)
    },

    getProducts: async ({ branchId, menuId } = {}) => {
        if (localDb.canUseLocal()) {
            const rows = await localDb.getProducts(branchId, null, menuId)
            return normalizeLocalProducts(rows)
        }

        let query = supabase
            .from('products')
            .select('*, categories(id, name, menu_id, menus(*)), product_recipes(id, inventory_item_id, quantity_required, wastage_percentage, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit))')
            .eq('is_active', true)

        if (branchId) {
            query = query.eq('branch_id', branchId)
        }

        if (menuId && menuId !== 'auto') {
            query = query.eq('categories.menu_id', menuId)
        }

        query = query.order('name')

        const { data, error } = await query

        if (error && String(error.message || '').includes('wastage_percentage')) {
            let fallbackQuery = supabase
                .from('products')
                .select('*, categories(id, name, menu_id, menus(*)), product_recipes(id, inventory_item_id, quantity_required, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit))')
                .eq('is_active', true)

            if (branchId) {
                fallbackQuery = fallbackQuery.eq('branch_id', branchId)
            }

            if (menuId && menuId !== 'auto') {
                fallbackQuery = fallbackQuery.eq('categories.menu_id', menuId)
            }

            const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('name')

            if (fallbackError) throw fallbackError
            return catalogApi.filterProductsForPOS(fallbackData)
        }

        if (error) throw error
        return catalogApi.filterProductsForPOS(data)
    },

    getMenus: async (branchId) => {
        if (localDb.canUseLocal()) {
            return localDb.getMenus(branchId)
        }

        let query = supabase.from('menus').select('*').order('name')
        if (branchId) {
            query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`)
        }
        const { data, error } = await query
        if (error) throw error
        return (data || []).map((menu) => ({ ...menu, active_days: catalogApi.normalizeActiveDays(menu.active_days) }))
    },

    getTables: async (branchId) => {
        const layout = await salonApi.getLayout(branchId)
        return layout.tables
    }
}
