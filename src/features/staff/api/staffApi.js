import { supabase } from '@/lib/supabase'

export const DEFAULT_PERMISSIONS = {
  access_admin: false,
  access_pos: true,
  view_reports: false,
  manage_inventory: false,
  manage_staff: false,
  modify_prices: false,
  delete_orders: false
}

export const ROLE_PERMISSIONS = {
  admin: {
    access_admin: true,
    access_pos: true,
    view_reports: true,
    manage_inventory: true,
    manage_staff: true,
    modify_prices: true,
    delete_orders: true
  },
  manager: {
    access_admin: true,
    access_pos: true,
    view_reports: true,
    manage_inventory: true,
    manage_staff: false,
    modify_prices: true,
    delete_orders: true
  },
  cashier: {
    access_admin: false,
    access_pos: true,
    view_reports: false,
    manage_inventory: true,
    manage_staff: false,
    modify_prices: false,
    delete_orders: false
  },
  waiter: DEFAULT_PERMISSIONS,
  captain: DEFAULT_PERMISSIONS
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
  waiter: 'Mesero',
  captain: 'Capitan'
}

export const PERMISSION_LABELS = [
  { id: 'access_admin', label: 'Administracion' },
  { id: 'access_pos', label: 'Punto de venta' },
  { id: 'manage_inventory', label: 'Inventarios' },
  { id: 'manage_staff', label: 'Personal' },
  { id: 'view_reports', label: 'Reportes' },
  { id: 'modify_prices', label: 'Precios/descuentos' },
  { id: 'delete_orders', label: 'Eliminar cuentas' }
]

function normalizePermissions(role = 'waiter', permissions = {}) {
  return {
    ...(ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS),
    ...(permissions || {})
  }
}

function normalizeStaff(row) {
  return {
    ...row,
    permissions: normalizePermissions(row.role, row.permissions),
    branchName: row.branches?.name || 'Sin sucursal',
    pinConfigured: Boolean(row.pin_code_hash || row.pin_code)
  }
}

async function invokeAdminService(body) {
  const { data, error } = await supabase.functions.invoke('admin-service', { body })
  if (error) throw new Error(error.message || 'No se pudo ejecutar admin-service')
  if (data?.error) throw new Error(data.error)
  return data
}

export const staffApi = {
  normalizePermissions,

  async getStaff() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, permissions, branch_id, updated_at, last_login_at, created_at, pin_code_hash, branches(id, name)')
      .order('full_name')

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active, permissions, branch_id, created_at')
        .order('full_name')

      if (fallbackError) throw error
      return (fallbackData || []).map(normalizeStaff)
    }

    return (data || []).map(normalizeStaff)
  },

  async getBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, is_active')
      .eq('is_active', true)
      .order('name')

    if (error) return []
    return data || []
  },

  async createStaff(userData) {
    return invokeAdminService({ action: 'create_user', userData })
  },

  async updateStaff(userId, userData) {
    return invokeAdminService({ action: 'update_user', userId, userData })
  },

  async deactivateStaff(userId) {
    return invokeAdminService({ action: 'deactivate_user', userId })
  },

  async reactivateStaff(userId) {
    return invokeAdminService({ action: 'reactivate_user', userId })
  },

  async deleteStaff(userId) {
    return invokeAdminService({ action: 'delete_user', userId })
  },

  async getWelcomeTemplate() {
    const { data, error } = await supabase
      .from('staff_config')
      .select('id, welcome_template')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return data?.[0] || null
  },

  async saveWelcomeTemplate(template) {
    const existing = await staffApi.getWelcomeTemplate()
    if (existing?.id) {
      const { error } = await supabase
        .from('staff_config')
        .update({ welcome_template: template, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('staff_config')
      .insert([{ welcome_template: template }])

    if (error) throw error
  }
}
