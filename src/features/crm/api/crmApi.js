import { supabase } from '@/lib/supabase'

const migrationMessage = 'CRM y lealtad requieren aplicar la migracion crm_loyalty_mvp en Supabase.'

const isMissingSchemaError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return error?.code === 'PGRST202'
    || error?.code === '42P01'
    || error?.code === '42703'
    || message.includes('could not find')
    || message.includes('does not exist')
}

const assertNoSchemaError = (error) => {
  if (!error) return
  if (isMissingSchemaError(error)) {
    throw new Error(migrationMessage)
  }
  throw error
}

const normalizePhone = (phone) => (phone || '').replace(/\D/g, '')

const normalizeCustomerPayload = (customer, branchId) => ({
  name: customer.name?.trim(),
  email: customer.email?.trim()?.toLowerCase() || null,
  phone: customer.phone?.trim() || null,
  branch_id: customer.branch_id || branchId || null,
  is_active: customer.is_active ?? true,
  metadata: customer.metadata || {},
  updated_at: new Date().toISOString()
})

const scopedByBranch = (query, branchId) => {
  if (!branchId) return query
  return query.or(`branch_id.eq.${branchId},branch_id.is.null`)
}

const getCount = async (table, column, value) => {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)

  assertNoSchemaError(error)
  return count || 0
}

export const crmApi = {
  async getDashboard(branchId) {
    const { data, error } = await supabase.rpc('get_crm_dashboard', {
      p_branch_id: branchId || null
    })

    if (!error) return data || {}
    if (!isMissingSchemaError(error)) throw error

    const { data: customers, error: customerError } = await scopedByBranch(
      supabase.from('customers').select('*'),
      branchId
    )
    assertNoSchemaError(customerError)

    const activeCustomers = (customers || []).filter((customer) => customer.is_active !== false)
    return {
      activeCustomers: activeCustomers.length,
      vipCustomers: activeCustomers.filter((customer) => Number(customer.loyalty_points || 0) >= 500).length,
      pointsInCirculation: activeCustomers.reduce((sum, customer) => sum + Number(customer.loyalty_points || 0), 0),
      totalSpent: activeCustomers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0),
      averageTicket: 0,
      reservationsUpcoming: 0,
      activeRewards: 0,
      loyaltyAlerts: 0
    }
  },

  async getCustomers(branchId, filters = {}) {
    let query = supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })

    query = scopedByBranch(query, branchId)

    if (filters.activeOnly !== false) {
      query = query.neq('is_active', false)
    }

    if (filters.search) {
      const term = `%${filters.search.trim()}%`
      query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
    }

    const { data, error } = await query
    assertNoSchemaError(error)
    return data || []
  },

  async saveCustomer(customer, branchId) {
    if (!customer.name?.trim()) {
      throw new Error('El nombre del cliente es obligatorio.')
    }

    const payload = normalizeCustomerPayload(customer, branchId)

    if (customer.id) {
      const { data, error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', customer.id)
        .select()
        .single()

      assertNoSchemaError(error)
      return data
    }

    const existingPhone = normalizePhone(payload.phone)
    if (existingPhone || payload.email) {
      const existing = await this.findExistingCustomer({ phone: existingPhone, email: payload.email })
      if (existing) return existing
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select()
      .single()

    assertNoSchemaError(error)
    return data
  },

  async findExistingCustomer({ phone, email }) {
    let query = supabase
      .from('customers')
      .select('*')
      .neq('is_active', false)
      .limit(20)

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`)
    } else if (email) {
      query = query.eq('email', email)
    } else if (phone) {
      query = query.eq('phone', phone)
    } else {
      return null
    }

    const { data, error } = await query
    assertNoSchemaError(error)

    const normalizedPhone = normalizePhone(phone)
    return (data || []).find((customer) => (
      (email && customer.email?.toLowerCase() === email)
      || (normalizedPhone && normalizePhone(customer.phone) === normalizedPhone)
    )) || null
  },

  async upsertCustomerFromPos({ name, phone, email, branchId }) {
    const { data, error } = await supabase.rpc('upsert_customer_from_pos', {
      p_name: name,
      p_phone: phone || null,
      p_email: email || null,
      p_branch_id: branchId || null
    })

    assertNoSchemaError(error)
    return data
  },

  async deactivateOrDeleteCustomer(customerId) {
    const [orders, reservations, transactions] = await Promise.all([
      getCount('orders', 'customer_id', customerId),
      getCount('reservations', 'customer_id', customerId),
      getCount('loyalty_transactions', 'customer_id', customerId)
    ])

    if (orders + reservations + transactions > 0) {
      const { data, error } = await supabase
        .from('customers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .select()
        .single()

      assertNoSchemaError(error)
      return { action: 'deactivated', customer: data }
    }

    const { error } = await supabase.from('customers').delete().eq('id', customerId)
    assertNoSchemaError(error)
    return { action: 'deleted' }
  },

  async getCustomerProfile(customerId) {
    const { data, error } = await supabase.rpc('get_customer_profile', {
      p_customer_id: customerId
    })

    if (!error) return data || {}
    if (!isMissingSchemaError(error)) throw error

    const [customerResult, ordersResult, loyaltyResult, reservationsResult] = await Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).single(),
      supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('loyalty_transactions').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('reservations').select('*').eq('customer_id', customerId).order('reservation_date', { ascending: false })
    ])

    assertNoSchemaError(customerResult.error)
    assertNoSchemaError(ordersResult.error)
    assertNoSchemaError(loyaltyResult.error)
    assertNoSchemaError(reservationsResult.error)

    return {
      customer: customerResult.data,
      orders: ordersResult.data || [],
      loyaltyTransactions: loyaltyResult.data || [],
      reservations: reservationsResult.data || []
    }
  },

  async getLoyaltyTransactions(customerId) {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    assertNoSchemaError(error)
    return data || []
  },

  async getAllLoyaltyTransactions(branchId) {
    let query = supabase
      .from('loyalty_transactions')
      .select('*, customers(name, phone, branch_id)')
      .order('created_at', { ascending: false })

    const { data, error } = await query
    assertNoSchemaError(error)

    if (!branchId) return data || []
    return (data || []).filter((row) => !row.customers?.branch_id || row.customers.branch_id === branchId)
  },

  async adjustLoyaltyPoints({ customerId, points, type, description }) {
    const { data, error } = await supabase.rpc('adjust_loyalty_points', {
      p_customer_id: customerId,
      p_points: Number(points),
      p_type: type,
      p_description: description
    })

    assertNoSchemaError(error)
    return data
  },

  async awardOrderLoyaltyPoints(orderId) {
    const { data, error } = await supabase.rpc('award_order_loyalty_points', {
      p_order_id: orderId
    })

    assertNoSchemaError(error)
    return data
  },

  async redeemLoyaltyReward({ customerId, rewardId, orderId }) {
    const { data, error } = await supabase.rpc('redeem_loyalty_reward', {
      p_customer_id: customerId,
      p_reward_id: rewardId,
      p_order_id: orderId || null
    })

    assertNoSchemaError(error)
    return data
  },

  async getRewards(branchId, activeOnly = true) {
    let query = supabase
      .from('loyalty_rewards')
      .select('*')
      .order('points_cost', { ascending: true })

    query = scopedByBranch(query, branchId)
    if (activeOnly) query = query.neq('is_active', false)

    const { data, error } = await query
    assertNoSchemaError(error)
    return data || []
  },

  async saveReward(reward, branchId) {
    if (!reward.title?.trim()) throw new Error('El nombre de la recompensa es obligatorio.')
    if (Number(reward.points_cost) <= 0) throw new Error('El costo en puntos debe ser mayor a cero.')

    const payload = {
      title: reward.title.trim(),
      description: reward.description?.trim() || null,
      points_cost: Number(reward.points_cost),
      icon_name: reward.icon_name || 'Gift',
      branch_id: reward.branch_id || branchId || null,
      is_active: reward.is_active ?? true,
      updated_at: new Date().toISOString()
    }

    const query = reward.id
      ? supabase.from('loyalty_rewards').update(payload).eq('id', reward.id)
      : supabase.from('loyalty_rewards').insert(payload)

    const { data, error } = await query.select().single()
    assertNoSchemaError(error)
    return data
  },

  async deleteReward(rewardId) {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', rewardId)
      .select()
      .single()

    assertNoSchemaError(error)
    return data
  },

  async getReservations(branchId, dateFilters = {}) {
    let query = supabase
      .from('reservations')
      .select('*, customers(name, phone, email), tables(name, capacity, area_id)')
      .order('reservation_date', { ascending: true })

    if (branchId) query = query.eq('branch_id', branchId)
    if (dateFilters.startDate) query = query.gte('reservation_date', dateFilters.startDate)
    if (dateFilters.endDate) query = query.lte('reservation_date', dateFilters.endDate)

    const { data, error } = await query
    assertNoSchemaError(error)
    return data || []
  },

  async checkTableAvailability({ tableId, reservationDate, durationMinutes = 120, reservationId = null }) {
    const startTime = new Date(reservationDate)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    let query = supabase
      .from('reservations')
      .select('id, reservation_date, duration_minutes')
      .eq('table_id', tableId)
      .in('status', ['pending', 'confirmed', 'seated'])

    if (reservationId) query = query.neq('id', reservationId)

    const { data, error } = await query
    assertNoSchemaError(error)

    return !(data || []).some((reservation) => {
      const reservationStart = new Date(reservation.reservation_date)
      const reservationEnd = new Date(reservationStart.getTime() + (reservation.duration_minutes || 120) * 60000)
      return startTime < reservationEnd && endTime > reservationStart
    })
  },

  async createReservation(reservation, branchId) {
    if (!branchId) throw new Error('Selecciona una sucursal antes de crear la reservacion.')

    if (reservation.table_id) {
      const available = await this.checkTableAvailability({
        tableId: reservation.table_id,
        reservationDate: reservation.reservation_date,
        durationMinutes: reservation.duration_minutes || 120
      })
      if (!available) throw new Error('La mesa ya tiene una reservacion en ese horario.')
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...reservation,
        branch_id: branchId,
        duration_minutes: reservation.duration_minutes || 120,
        status: reservation.status || 'pending'
      })
      .select('*, customers(name, phone, email), tables(name)')
      .single()

    assertNoSchemaError(error)
    return data
  },

  async updateReservationStatus(reservationId, status) {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reservationId)
      .select()
      .single()

    assertNoSchemaError(error)
    return data
  }
}

export default crmApi
