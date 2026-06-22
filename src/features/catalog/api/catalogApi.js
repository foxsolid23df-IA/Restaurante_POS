import { supabase } from '@/lib/supabase'

export const DEFAULT_ACTIVE_DAYS = [0, 1, 2, 3, 4, 5, 6]

export function normalizeActiveDays(activeDays) {
  if (Array.isArray(activeDays)) {
    return activeDays.map(Number).filter((day) => day >= 0 && day <= 6)
  }

  if (typeof activeDays === 'string') {
    try {
      const parsed = JSON.parse(activeDays)
      return normalizeActiveDays(parsed)
    } catch {
      return DEFAULT_ACTIVE_DAYS
    }
  }

  return DEFAULT_ACTIVE_DAYS
}

export function isMenuActiveNow(menu, now = new Date()) {
  if (!menu) return true
  if (menu.is_active === false) return false

  const activeDays = normalizeActiveDays(menu.active_days)
  const currentDay = now.getDay()
  if (!activeDays.includes(currentDay)) return false

  if (!menu.start_time || !menu.end_time) return true

  const currentTime = now.toTimeString().slice(0, 8)
  const startTime = menu.start_time.length === 5 ? `${menu.start_time}:00` : menu.start_time
  const endTime = menu.end_time.length === 5 ? `${menu.end_time}:00` : menu.end_time

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime
  }

  return currentTime >= startTime || currentTime <= endTime
}

export function formatMenuDays(activeDays) {
  const days = normalizeActiveDays(activeDays)
  const labels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  if (days.length === 7) return 'Todos los dias'
  return days.sort((a, b) => a - b).map((day) => labels[day]).join(', ')
}

function parseNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function enrichProduct(product) {
  const recipes = product.product_recipes || []
  const totalCost = recipes.reduce((sum, recipe) => {
    const quantity = parseNumber(recipe.quantity_required)
    const wastage = parseNumber(recipe.wastage_percentage)
    const unitCost = parseNumber(recipe.inventory_items?.cost_per_unit)
    return sum + quantity * (1 + wastage / 100) * unitCost
  }, 0)
  const price = parseNumber(product.price)
  const hasMissingCost = recipes.some((recipe) => parseNumber(recipe.inventory_items?.cost_per_unit) <= 0)
  const hasLowStock = recipes.some((recipe) => {
    const item = recipe.inventory_items
    if (!item) return false
    return parseNumber(item.current_stock) <= parseNumber(item.min_stock)
  })

  return {
    ...product,
    recipeCost: totalCost,
    grossProfit: price - totalCost,
    foodCostPercentage: price > 0 ? (totalCost / price) * 100 : 0,
    grossMargin: price > 0 ? ((price - totalCost) / price) * 100 : 0,
    hasRecipe: recipes.length > 0,
    hasMissingCost,
    hasLowStock,
    categoryName: product.categories?.name || 'Sin categoria',
    menu: product.categories?.menus || null,
    isMenuAvailable: isMenuActiveNow(product.categories?.menus),
    requiresConfiguration: recipes.length === 0 || hasMissingCost || !product.category_id
  }
}

async function getProductsWithRecipes() {
  const selectWithWastage = `
    *,
    categories(id, name, menu_id, printer_id, menus(*), printers(name)),
    product_recipes(id, inventory_item_id, quantity_required, wastage_percentage, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit, branch_id))
  `

  const { data, error } = await supabase
    .from('products')
    .select(selectWithWastage)
    .order('name')

  if (!error) return data || []

  if (!String(error.message || '').includes('wastage_percentage')) {
    throw error
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('products')
    .select('*, categories(id, name, menu_id, printer_id, menus(*), printers(name)), product_recipes(id, inventory_item_id, quantity_required, inventory_items(id, name, unit, current_stock, min_stock, cost_per_unit, branch_id))')
    .order('name')

  if (fallbackError) throw fallbackError
  return fallbackData || []
}

export const catalogApi = {
  async getCatalogDashboard() {
    const [products, categories, menus] = await Promise.all([
      catalogApi.getProducts(),
      catalogApi.getCategories(),
      catalogApi.getMenus()
    ])

    return { products, categories, menus }
  },

  async getProducts() {
    const products = await getProductsWithRecipes()
    return products.map(enrichProduct)
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, printers(id, name), menus(*)')
      .order('name')

    if (error) throw error
    return (data || []).map((category) => ({
      ...category,
      menus: category.menus ? { ...category.menus, active_days: normalizeActiveDays(category.menus.active_days) } : null
    }))
  },

  async getMenus({ branchId } = {}) {
    let query = supabase.from('menus').select('*').order('name')
    if (branchId) query = query.or(`branch_id.is.null,branch_id.eq.${branchId}`)

    const { data, error } = await query
    if (error) throw error
    return (data || []).map((menu) => ({
      ...menu,
      active_days: normalizeActiveDays(menu.active_days)
    }))
  },

  async saveProduct(product) {
    const data = {
      name: product.name?.trim(),
      category_id: product.category_id || null,
      price: parseNumber(product.price),
      image_url: product.image_url?.trim() || null,
      is_active: product.is_active ?? true
    }

    if (!data.name) throw new Error('El nombre del producto es requerido')
    if (data.price < 0) throw new Error('El precio no puede ser negativo')
    if (!data.category_id) throw new Error('Selecciona una categoria')

    const query = product.id
      ? supabase.from('products').update(data).eq('id', product.id)
      : supabase.from('products').insert([data])

    const { data: saved, error } = await query.select().single()
    if (error) throw error
    return saved
  },

  async toggleProductActive(product) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteProduct(productId) {
    const { count, error: countError } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    if (countError) throw countError
    if (count > 0) {
      return { deleted: false, reason: 'has_history', count }
    }

    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) throw error
    return { deleted: true, count: 0 }
  },

  async saveCategory(category) {
    const data = {
      name: category.name?.trim(),
      printer_id: category.printer_id || null,
      menu_id: category.menu_id || null
    }

    if (!data.name) throw new Error('El nombre de la categoria es requerido')

    const query = category.id
      ? supabase.from('categories').update(data).eq('id', category.id)
      : supabase.from('categories').insert([data])

    const { data: saved, error } = await query.select().single()
    if (error) throw error
    return saved
  },

  async deleteCategory(categoryId) {
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (countError) throw countError
    if (count > 0) {
      return { deleted: false, reason: 'has_products', count }
    }

    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    if (error) throw error
    return { deleted: true, count: 0 }
  },

  async saveMenu(menu, branchId) {
    const activeDays = normalizeActiveDays(menu.active_days)
    const data = {
      name: menu.name?.trim(),
      start_time: menu.start_time || null,
      end_time: menu.end_time || null,
      active_days: activeDays.length > 0 ? activeDays : DEFAULT_ACTIVE_DAYS,
      is_active: menu.is_active ?? true,
      branch_id: branchId || menu.branch_id || null,
      updated_at: new Date().toISOString()
    }

    if (!data.name) throw new Error('El nombre del menu es requerido')
    if (data.active_days.length === 0) throw new Error('Selecciona al menos un dia')
    if ((data.start_time && !data.end_time) || (!data.start_time && data.end_time)) {
      throw new Error('Captura hora de inicio y fin')
    }

    const query = menu.id
      ? supabase.from('menus').update(data).eq('id', menu.id)
      : supabase.from('menus').insert([data])

    const { data: saved, error } = await query.select().single()
    if (error) throw error
    return { ...saved, active_days: normalizeActiveDays(saved.active_days) }
  },

  async deleteMenu(menuId) {
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('menu_id', menuId)

    if (countError) throw countError
    if (count > 0) {
      return { deleted: false, reason: 'has_categories', count }
    }

    const { error } = await supabase.from('menus').delete().eq('id', menuId)
    if (error) throw error
    return { deleted: true, count: 0 }
  },

  async getRecipe(productId, branchId) {
    const productQuery = supabase
      .from('products')
      .select('*, categories(id, name)')
      .eq('id', productId)
      .single()

    let inventoryQuery = supabase.from('inventory_items').select('*').order('name')
    if (branchId) inventoryQuery = inventoryQuery.or(`branch_id.is.null,branch_id.eq.${branchId}`)

    const recipeQuery = supabase
      .from('product_recipes')
      .select('*, inventory_items(*)')
      .eq('product_id', productId)

    const [productRes, inventoryRes, recipeRes] = await Promise.all([productQuery, inventoryQuery, recipeQuery])
    if (productRes.error) throw productRes.error
    if (inventoryRes.error) throw inventoryRes.error
    if (recipeRes.error) throw recipeRes.error

    return {
      product: productRes.data,
      inventoryItems: inventoryRes.data || [],
      recipe: (recipeRes.data || []).map((row) => ({
        id: row.id,
        inventory_item_id: row.inventory_item_id,
        quantity_required: row.quantity_required,
        wastage_percentage: row.wastage_percentage || 0,
        item: row.inventory_items
      }))
    }
  },

  async saveRecipe(productId, recipe) {
    const cleanRows = recipe
      .filter((row) => row.inventory_item_id && parseNumber(row.quantity_required) > 0)
      .map((row) => ({
        product_id: productId,
        inventory_item_id: row.inventory_item_id,
        quantity_required: parseNumber(row.quantity_required),
        wastage_percentage: Math.max(0, parseNumber(row.wastage_percentage))
      }))

    const duplicateIds = cleanRows.map((row) => row.inventory_item_id)
    if (new Set(duplicateIds).size !== duplicateIds.length) {
      throw new Error('Hay insumos duplicados en la receta')
    }

    const invalidWastage = cleanRows.some((row) => row.wastage_percentage > 100)
    if (invalidWastage) throw new Error('La merma no debe superar 100%')

    const { error: deleteError } = await supabase
      .from('product_recipes')
      .delete()
      .eq('product_id', productId)

    if (deleteError) throw deleteError

    if (cleanRows.length === 0) return []

    const { data, error } = await supabase
      .from('product_recipes')
      .insert(cleanRows)
      .select()

    if (error) throw error
    return data || []
  },

  filterCategoriesForPOS(categories) {
    return (categories || []).filter((category) => isMenuActiveNow(category.menus))
  },

  filterProductsForPOS(products) {
    return (products || [])
      .map(enrichProduct)
      .filter((product) => product.is_active && product.category_id && product.isMenuAvailable)
  }
}
