import { supabase } from '@/lib/supabase'

const migrationError = (action) => (
  new Error(`No se pudo ${action}. Aplica la migracion branches_mvp en Supabase y vuelve a intentar.`)
)

const toBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (value === null || value === undefined) return fallback
  return Boolean(value)
}

const isMissingSchema = (error) => (
  error?.code === '42P01'
  || error?.code === '42703'
  || /does not exist/i.test(error?.message || '')
  || /Could not find/i.test(error?.message || '')
)

export const normalizeBranch = (branch = {}) => ({
  ...branch,
  id: branch.id,
  name: branch.name || 'Sucursal sin nombre',
  code: branch.code || '',
  address: branch.address || '',
  phone: branch.phone || '',
  email: branch.email || '',
  currency: branch.currency || branch.default_currency || 'MXN',
  timezone: branch.timezone || 'America/Mexico_City',
  openingHours: branch.openingHours || branch.opening_hours || {},
  isActive: toBool(branch.isActive ?? branch.is_active, true),
  is_active: toBool(branch.is_active ?? branch.isActive, true),
  isMainOffice: toBool(branch.isMainOffice ?? branch.is_main_office),
  is_main_office: toBool(branch.is_main_office ?? branch.isMainOffice),
  createdAt: branch.createdAt || branch.created_at,
  updatedAt: branch.updatedAt || branch.updated_at,
  deactivatedAt: branch.deactivatedAt || branch.deactivated_at,
  deactivationReason: branch.deactivationReason || branch.deactivation_reason || ''
})

const branchPayload = (branch = {}) => ({
  name: branch.name?.trim(),
  code: branch.code?.trim() || null,
  address: branch.address?.trim() || null,
  phone: branch.phone?.trim() || null,
  email: branch.email?.trim() || null,
  timezone: branch.timezone || 'America/Mexico_City',
  opening_hours: branch.openingHours || branch.opening_hours || {},
  is_active: branch.isActive ?? branch.is_active ?? true,
  is_main_office: branch.isMainOffice ?? branch.is_main_office ?? false
})

async function rpcOrThrow(name, params, action) {
  const { data, error } = await supabase.rpc(name, params)
  if (error) {
    if (error.code === '42883' || /function .* does not exist/i.test(error.message || '')) {
      throw migrationError(action)
    }
    throw error
  }
  return data
}

export const branchApi = {
  async getBranches({ includeInactive = false } = {}) {
    const columns = 'id, name, code, address, phone, email, timezone, opening_hours, is_active, is_main_office, created_at, updated_at, deactivated_at, deactivation_reason'
    let query = supabase.from('branches').select(columns).order('name')
    if (!includeInactive) query = query.eq('is_active', true)

    const { data, error } = await query
    if (!error) return (data || []).map(normalizeBranch)

    let fallbackQuery = supabase.from('branches').select('*').order('name')
    if (!includeInactive && !isMissingSchema(error)) fallbackQuery = fallbackQuery.eq('is_active', true)

    const { data: fallbackData, error: fallbackError } = await fallbackQuery
    if (fallbackError) throw fallbackError
    return (fallbackData || [])
      .map(normalizeBranch)
      .filter((branch) => includeInactive || branch.isActive)
  },

  async getDashboard() {
    const data = await rpcOrThrow('get_branches_dashboard', {}, 'cargar el tablero de sucursales')
    return (data || []).map(normalizeBranch)
  },

  async getBranchDetail(branchId) {
    if (!branchId) return null
    const data = await rpcOrThrow('get_branch_detail', { p_branch_id: branchId }, 'cargar el detalle de la sucursal')
    if (!data || Object.keys(data).length === 0) return null
    return {
      ...data,
      branch: normalizeBranch(data.branch)
    }
  },

  async createBranch(branch, { createDefaults = true } = {}) {
    if (!branch?.name?.trim()) throw new Error('El nombre de la sucursal es obligatorio.')
    const data = await rpcOrThrow(
      'create_branch_with_defaults',
      { p_branch: branchPayload(branch), p_create_defaults: createDefaults },
      'crear la sucursal'
    )
    return normalizeBranch(data)
  },

  async updateBranch(branchId, branch) {
    if (!branchId) throw new Error('Selecciona una sucursal para editar.')
    if (!branch?.name?.trim()) throw new Error('El nombre de la sucursal es obligatorio.')
    const data = await rpcOrThrow(
      'update_branch',
      { p_branch_id: branchId, p_branch: branchPayload(branch) },
      'actualizar la sucursal'
    )
    return normalizeBranch(data)
  },

  async deactivateBranch(branchId, reason) {
    if (!branchId) throw new Error('Selecciona una sucursal para desactivar.')
    if (!reason?.trim()) throw new Error('Indica el motivo de desactivacion.')
    return rpcOrThrow(
      'deactivate_branch',
      { p_branch_id: branchId, p_reason: reason.trim() },
      'desactivar la sucursal'
    )
  },

  async reactivateBranch(branchId, branch) {
    return this.updateBranch(branchId, {
      ...branch,
      isActive: true,
      is_active: true
    })
  }
}
