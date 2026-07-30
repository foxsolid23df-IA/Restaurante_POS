import { isElectron, electronAPI } from './electronBridge'
import { isMenuActiveNow, normalizeActiveDays } from '@/features/catalog/api/catalogApi'

// Local Database API for Electron mode
// Provides the same interface as Supabase but uses SQLite locally

class LocalDb {
  constructor() {
    this.isElectron = isElectron
  }

  // Check if we can use local database
  canUseLocal() {
    return this.isElectron && electronAPI?.db
  }

  // Get orders with related data
  async getOrders(branchId, filters = {}) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    let sql = `
      SELECT
        o.*,
        t.name as table_name,
        p.full_name as user_name,
        c.name as customer_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN profiles p ON o.user_id = p.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.branch_id = ?
    `
    const params = [branchId]

    if (filters.status) {
      sql += ' AND o.status = ?'
      params.push(filters.status)
    }

    if (filters.tableId) {
      sql += ' AND o.table_id = ?'
      params.push(filters.tableId)
    }

    if (filters.userId) {
      sql += ' AND o.user_id = ?'
      params.push(filters.userId)
    }

    if (filters.startDate) {
      sql += ' AND o.created_at >= ?'
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      sql += ' AND o.created_at <= ?'
      params.push(filters.endDate)
    }

    sql += ' ORDER BY o.created_at DESC'

    if (filters.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)
    }

    return electronAPI.db.query(sql, params)
  }

  // Get single order with items
  async getOrder(orderId) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    const order = await electronAPI.db.query(
      `
      SELECT
        o.*,
        t.name as table_name,
        p.full_name as user_name,
        c.name as customer_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN profiles p ON o.user_id = p.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `,
      [orderId]
    )

    if (order.length === 0) return null

    const items = await electronAPI.db.query(
      `
      SELECT
        oi.*,
        pr.name as product_name,
        pr.price as current_price
      FROM order_items oi
      LEFT JOIN products pr ON oi.product_id = pr.id
      WHERE oi.order_id = ?
    `,
      [orderId]
    )

    return { ...order[0], items }
  }

  // Create new order
  async createOrder(orderData) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    const orderId = orderData.id || crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert order
    await electronAPI.db.run(
      `
      INSERT INTO orders (
        id, table_id, user_id, customer_id, status, total_amount,
        created_at, branch_id, currency, customer_language, _synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `,
      [
        orderId,
        orderData.tableId,
        orderData.userId,
        orderData.customerId || null,
        'pending',
        orderData.totalAmount || 0,
        now,
        orderData.branchId,
        orderData.currency || 'MXN',
        orderData.customerLanguage || 'es'
      ]
    )

    // Insert order items
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        const itemId = item.id || crypto.randomUUID()
        await electronAPI.db.run(
          `
          INSERT INTO order_items (
            id, order_id, product_id, quantity, status, notes,
            price_at_order, created_at, _synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `,
          [
            itemId,
            orderId,
            item.productId,
            item.quantity || 1,
            'pending',
            item.notes || null,
            item.price,
            now
          ]
        )
      }
    }

    // Add to sync queue
    await this.addToSyncQueue('orders', orderId, 'INSERT', {
      ...orderData,
      id: orderId,
      created_at: now
    })

    return { id: orderId, created_at: now }
  }

  // Update order status
  async updateOrderStatus(orderId, status, paymentData = null) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    const now = new Date().toISOString()
    const updates = { status, updated_at: now }

    if (paymentData) {
      updates.payment_method = paymentData.paymentMethod
      updates.payment_amount = paymentData.paymentAmount
      updates.change_amount = paymentData.change
      updates.closed_at = now
      updates.payment_user_id = paymentData.userId
    }

    let sql = 'UPDATE orders SET status = ?'
    const params = [status]

    if (paymentData) {
      sql += ', payment_method = ?, payment_amount = ?, change_amount = ?, closed_at = ?, payment_user_id = ?'
      params.push(
        paymentData.paymentMethod,
        paymentData.paymentAmount,
        paymentData.change,
        now,
        paymentData.userId
      )
    }

    sql += ', _synced = 0 WHERE id = ?'
    params.push(orderId)

    await electronAPI.db.run(sql, params)

    // Add to sync queue
    await this.addToSyncQueue('orders', orderId, 'UPDATE', updates)

    return { success: true }
  }

  // Get products
  async getProducts(branchId, categoryId = null, menuId = null) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    let sql = `
      SELECT
        p.*,
        c.name as category_name,
        c.menu_id,
        m.start_time as menu_start_time,
        m.end_time as menu_end_time,
        m.active_days as menu_active_days,
        m.is_active as menu_is_active
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN menus m ON c.menu_id = m.id
      WHERE p.is_active = 1
    `
    const params = []

    if (branchId) {
      sql += ' AND p.branch_id = ?'
      params.push(branchId)
    }

    if (categoryId) {
      sql += ' AND p.category_id = ?'
      params.push(categoryId)
    }

    if (menuId && menuId !== 'auto') {
      sql += ' AND c.menu_id = ?'
      params.push(menuId)
    }

    sql += ' ORDER BY p.sort_order, p.name'

    const products = await electronAPI.db.query(sql, params)

    // Apply menu schedule filter when in auto mode
    return products.filter((product) => {
      if (menuId && menuId !== 'auto') return true
      const menu = product.menu_id
        ? {
            id: product.menu_id,
            start_time: product.menu_start_time,
            end_time: product.menu_end_time,
            active_days: normalizeActiveDays(product.menu_active_days),
            is_active: product.menu_is_active !== 0
          }
        : null
      return isMenuActiveNow(menu)
    })
  }

  // Get categories
  async getCategories(branchId, menuId = null) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    let sql = `
      SELECT
        c.*,
        m.id as menu_id,
        m.name as menu_name,
        m.start_time as menu_start_time,
        m.end_time as menu_end_time,
        m.active_days as menu_active_days,
        m.is_active as menu_is_active,
        m.branch_id as menu_branch_id,
        pr.name as printer_name
      FROM categories c
      LEFT JOIN menus m ON c.menu_id = m.id
      LEFT JOIN printers pr ON c.printer_id = pr.id
      WHERE 1=1
    `
    const params = []

    if (branchId) {
      sql += ' AND (m.branch_id = ? OR m.branch_id IS NULL)'
      params.push(branchId)
    }

    if (menuId && menuId !== 'auto') {
      sql += ' AND c.menu_id = ?'
      params.push(menuId)
    }

    sql += ' ORDER BY c.sort_order, c.name'

    const categories = await electronAPI.db.query(sql, params)

    // Apply menu schedule filter when in auto mode
    return categories.filter((category) => {
      if (menuId && menuId !== 'auto') return true
      const menu = category.menu_id
        ? {
            id: category.menu_id,
            start_time: category.menu_start_time,
            end_time: category.menu_end_time,
            active_days: normalizeActiveDays(category.menu_active_days),
            is_active: category.menu_is_active !== 0
          }
        : null
      return isMenuActiveNow(menu)
    })
  }

  // Get menus
  async getMenus(branchId) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    let sql = 'SELECT * FROM menus WHERE 1=1'
    const params = []

    if (branchId) {
      sql += ' AND (branch_id = ? OR branch_id IS NULL)'
      params.push(branchId)
    }

    sql += ' ORDER BY name'

    const menus = await electronAPI.db.query(sql, params)
    return menus.map((menu) => ({
      ...menu,
      active_days: normalizeActiveDays(menu.active_days)
    }))
  }

  // Get tables
  async getTables(branchId) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    return electronAPI.db.query(
      `
      SELECT
        t.*,
        a.name as area_name,
        a.color as area_color
      FROM tables t
      LEFT JOIN areas a ON t.area_id = a.id
      WHERE t.is_active = 1 AND t.branch_id = ?
      ORDER BY a.sort_order, t.sort_order
    `,
      [branchId]
    )
  }

  // Update table status
  async updateTableStatus(tableId, status) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    await electronAPI.db.run(
      'UPDATE tables SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, tableId]
    )

    await this.addToSyncQueue('tables', tableId, 'UPDATE', { status })
  }

  // Get business settings
  async getSettings() {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    const settings = await electronAPI.db.query(
      'SELECT * FROM business_settings LIMIT 1'
    )
    return settings[0] || null
  }

  // Get customers
  async getCustomers(branchId, search = null) {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    let sql = 'SELECT * FROM customers WHERE branch_id = ?'
    const params = [branchId]

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    sql += ' ORDER BY name'

    return electronAPI.db.query(sql, params)
  }

  // Add to sync queue helper
  async addToSyncQueue(tableName, recordId, operation, payload) {
    if (!this.canUseLocal()) return

    await electronAPI.db.run(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload, created_at, synced) VALUES (?, ?, ?, ?, datetime(\'now\'), 0)',
      [tableName, recordId, operation, JSON.stringify(payload)]
    )
  }

  // Check sync queue status
  async getSyncStatus() {
    if (!this.canUseLocal()) {
      return { pending: 0, synced: 0 }
    }

    const pending = await electronAPI.db.query(
      'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0'
    )
    const synced = await electronAPI.db.query(
      'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 1'
    )

    return {
      pending: pending[0]?.count || 0,
      synced: synced[0]?.count || 0
    }
  }

  // Manual sync trigger
  async syncNow() {
    if (!this.canUseLocal()) {
      throw new Error('Local database not available')
    }

    if (!electronAPI.sync?.now) {
      throw new Error('Sync API not available')
    }

    return electronAPI.sync.now()
  }
}

// Export singleton instance
export const localDb = new LocalDb()
export default localDb
