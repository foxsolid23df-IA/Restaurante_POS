import { supabase } from '@/lib/supabase'

const isMissingRpc = (error) => (
  error?.code === 'PGRST202'
  || error?.code === '42883'
  || error?.code === '404'
  || /function .* does not exist/i.test(error?.message || '')
  || /Could not find the function/i.test(error?.message || '')
)

const isMissingSchema = (error) => (
  error?.code === '42P01'
  || error?.code === '42703'
  || error?.code === '404'
  || /does not exist/i.test(error?.message || '')
  || /Could not find/i.test(error?.message || '')
)

const migrationError = (action) => (
  new Error(`No se pudo ${action}. Aplica la migracion settings_mvp en Supabase y vuelve a intentar.`)
)

const numberValue = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeSettings = (settings = {}) => {
  const name = settings.name || settings.business_name || 'Mi Restaurante'

  return {
    ...settings,
    name,
    business_name: settings.business_name || name,
    currency: settings.currency || 'MXN',
    tax_rate: numberValue(settings.tax_rate, 0.16),
    tax_name: settings.tax_name || 'IVA',
    ticket_header: settings.ticket_header || '',
    ticket_footer: settings.ticket_footer || 'Gracias por su visita!',
    is_electronic_invoicing_enabled: Boolean(settings.is_electronic_invoicing_enabled),
    points_per_currency: numberValue(settings.points_per_currency, 1),
    currency_unit_amount: numberValue(settings.currency_unit_amount, 10),
    daily_points_limit: Number.parseInt(settings.daily_points_limit || 1000, 10),
    updated_at: settings.updated_at,
    updated_by: settings.updated_by
  }
}

const settingsPayload = (settings = {}) => ({
  name: settings.name?.trim(),
  business_name: (settings.business_name || settings.name)?.trim(),
  rfc: settings.rfc?.trim() || null,
  address: settings.address?.trim() || null,
  phone: settings.phone?.trim() || null,
  email: settings.email?.trim() || null,
  website: settings.website?.trim() || null,
  logo_url: settings.logo_url?.trim() || null,
  currency: settings.currency || 'MXN',
  tax_rate: numberValue(settings.tax_rate, 0.16),
  tax_name: settings.tax_name?.trim() || 'IVA',
  ticket_header: settings.ticket_header || '',
  ticket_footer: settings.ticket_footer || '',
  is_electronic_invoicing_enabled: Boolean(settings.is_electronic_invoicing_enabled),
  points_per_currency: numberValue(settings.points_per_currency, 1),
  currency_unit_amount: numberValue(settings.currency_unit_amount, 10),
  daily_points_limit: Number.parseInt(settings.daily_points_limit || 1000, 10)
})

async function rpcOrThrow(name, params, action) {
  const { data, error } = await supabase.rpc(name, params)
  if (!error) return data
  if (isMissingRpc(error)) throw migrationError(action)
  throw error
}

async function getBusinessSettingsFallback() {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    if (isMissingSchema(error)) return normalizeSettings({})
    throw error
  }

  return normalizeSettings(data?.[0] || {})
}

export const settingsApi = {
  normalizeSettings,

  async getBusinessSettings() {
    try {
      const data = await rpcOrThrow('get_business_settings', {}, 'cargar la configuracion')
      if (!data || Object.keys(data).length === 0) return getBusinessSettingsFallback()
      return normalizeSettings(data)
    } catch (error) {
      if (/settings_mvp/i.test(error.message || '') || isMissingRpc(error) || isMissingSchema(error)) {
        return getBusinessSettingsFallback()
      }
      throw error
    }
  },

  async updateBusinessSettings(settings) {
    if (!settings?.name?.trim()) throw new Error('El nombre comercial es obligatorio.')
    if (numberValue(settings.tax_rate, -1) < 0) throw new Error('La tasa de impuesto no puede ser negativa.')
    if (numberValue(settings.currency_unit_amount, 0) <= 0) throw new Error('El importe para puntos debe ser mayor a cero.')
    if (Number.parseInt(settings.daily_points_limit || 0, 10) <= 0) throw new Error('El limite diario de puntos debe ser mayor a cero.')

    const data = await rpcOrThrow(
      'update_business_settings',
      { p_settings: settingsPayload(settings) },
      'guardar la configuracion'
    )
    return normalizeSettings(data)
  },

  async getDashboard(branchId) {
    try {
      return await rpcOrThrow('get_settings_dashboard', { p_branch_id: branchId || null }, 'cargar el estado de configuracion')
    } catch (error) {
      if (!/settings_mvp/i.test(error.message || '') && !isMissingRpc(error) && !isMissingSchema(error)) throw error
      const settings = await getBusinessSettingsFallback()
      return {
        fiscalComplete: Boolean(settings.name && settings.tax_name),
        ticketConfigured: Boolean(settings.ticket_header || settings.ticket_footer),
        electronicInvoicingEnabled: Boolean(settings.is_electronic_invoicing_enabled),
        activePrinters: 0,
        lastUpdatedAt: settings.updated_at,
        lastUpdatedBy: null,
        auditCount: 0
      }
    }
  },

  async getPrinters(branchId) {
    if (!branchId) return []
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('branch_id', branchId)
      .neq('is_active', false)
      .order('name')

    if (error) {
      if (isMissingSchema(error)) return []
      throw error
    }
    return data || []
  },

  async savePrinter(printer, branchId) {
    if (!branchId) throw new Error('Selecciona una sucursal antes de configurar impresoras.')
    if (!printer?.name?.trim()) throw new Error('El nombre de la impresora es obligatorio.')

    return rpcOrThrow(
      'save_printer_config',
      {
        p_printer: {
          id: printer.id || null,
          name: printer.name.trim(),
          branch_id: branchId,
          connection_type: printer.connection_type || 'network',
          ip_address: printer.ip_address || null,
          port: Number.parseInt(printer.port || 9100, 10),
          is_active: printer.is_active !== false,
          is_default: Boolean(printer.is_default)
        }
      },
      'guardar la impresora'
    )
  },

  async deactivatePrinter(printerId) {
    if (!printerId) throw new Error('Selecciona una impresora para desactivar.')
    return rpcOrThrow(
      'deactivate_printer_config',
      { p_printer_id: printerId },
      'desactivar la impresora'
    )
  },

  async getAuditLog(limit = 50) {
    const { data, error } = await supabase
      .from('settings_audit_log')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (isMissingSchema(error)) return []
      throw error
    }
    return data || []
  }
}
