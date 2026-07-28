import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-profile-id, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

type AdminAction =
  | 'create_user'
  | 'update_user'
  | 'deactivate_user'
  | 'reactivate_user'
  | 'delete_user'
  | 'list_subscriptions'
  | 'create_license_user'
  | 'update_subscription'
  | 'suspend_subscription'
  | 'reactivate_subscription'

type UserData = {
  email?: string
  password?: string
  full_name?: string
  role?: string
  pin_code?: string
  permissions?: Record<string, boolean>
  branch_id?: string | null
  is_active?: boolean
}

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  access_admin: false,
  access_pos: true,
  view_reports: false,
  manage_inventory: false,
  manage_staff: false,
  modify_prices: false,
  delete_orders: false
}

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
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

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

const hashPin = async (pin?: string) => {
  if (!pin) return null
  if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe tener 4 digitos')
  const data = new TextEncoder().encode(pin)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const normalizePermissions = (role = 'waiter', permissions?: Record<string, boolean>) => ({
  ...(ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS),
  ...(permissions || {})
})

const LICENSE_ADMIN_EMAIL = 'admin@restaurante.com'

const requireLicenseAdmin = (email: string | null) => {
  if (!email || email.toLowerCase() !== LICENSE_ADMIN_EMAIL.toLowerCase()) {
    return jsonResponse({ error: 'Solo el administrador de licencias puede ejecutar esta accion' }, 403)
  }
  return null
}

Deno.serve(async (req) => {
  console.log(`[admin-service] ${req.method} ${req.url}`)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo no permitido' }, 405)
  }

  try {
    const rawBody = await req.text()
    console.log('[admin-service] Raw body:', rawBody)

    let payload
    try {
      payload = rawBody ? JSON.parse(rawBody) : {}
    } catch (parseErr) {
      console.error('[admin-service] JSON parse error:', parseErr)
      return jsonResponse({ error: 'Body invalido: se esperaba JSON' }, 400)
    }

    console.log('[admin-service] Parsed payload:', JSON.stringify(payload, null, 2))

    const action = payload.action as AdminAction
    const userId = payload.userId as string | undefined
    const userData = (payload.userData || {}) as UserData
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('[admin-service] Env vars present:', {
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey,
      SUPABASE_ANON_KEY: !!anonKey
    })

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('[admin-service] Missing env vars')
      return jsonResponse({ error: 'Faltan variables de entorno de Supabase' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    const profileIdHeader = req.headers.get('X-Profile-Id')

    console.log('[admin-service] Headers:', { hasAuth: !!authHeader, hasProfileId: !!profileIdHeader })

    let callerUserId: string | null = null
    let callerEmail: string | null = null

    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      })
      const { data: callerData, error: callerError } = await userClient.auth.getUser()
      if (callerError || !callerData.user) return jsonResponse({ error: 'Sesion invalida' }, 401)
      callerUserId = callerData.user.id
      callerEmail = callerData.user.email || null
    } else if (profileIdHeader) {
      callerUserId = profileIdHeader
    } else {
      return jsonResponse({ error: 'Sesion requerida' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, permissions, is_active')
      .eq('id', callerUserId)
      .single()

    console.log('[admin-service] Caller profile:', { id: callerProfile?.id, role: callerProfile?.role, is_active: callerProfile?.is_active, hasPermissions: !!callerProfile?.permissions })

    if (profileError || !callerProfile?.is_active) {
      console.error('[admin-service] Unauthorized profile:', profileError?.message || 'inactive')
      return jsonResponse({ error: 'Perfil no autorizado' }, 403)
    }

    const canManageStaff =
      callerProfile.role === 'admin' ||
      Boolean(callerProfile.permissions?.manage_staff)

    console.log('[admin-service] canManageStaff:', canManageStaff)

    if (!canManageStaff) {
      console.error('[admin-service] Permission denied: manage_staff required')
      return jsonResponse({ error: 'Permiso manage_staff requerido' }, 403)
    }

    console.log('[admin-service] Action received:', action)

    if (action === 'create_user') {
      if (!userData.email || !userData.password || !userData.full_name || !userData.pin_code) {
        console.error('[admin-service] create_user missing fields')
        return jsonResponse({ error: 'Nombre, correo, password y PIN son requeridos' }, 400)
      }

      const pinHash = await hashPin(userData.pin_code)
      const role = userData.role || 'waiter'
      const permissions = normalizePermissions(role, userData.permissions)

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { full_name: userData.full_name }
      })
      if (createError || !created.user) throw createError || new Error('No se pudo crear usuario')

      const { error: profileInsertError } = await adminClient.from('profiles').insert({
        id: created.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role,
        branch_id: userData.branch_id || null,
        pin_code_hash: pinHash,
        pin_code: userData.pin_code,
        permissions,
        is_active: true,
        updated_at: new Date().toISOString()
      })

      if (profileInsertError) {
        await adminClient.auth.admin.deleteUser(created.user.id)
        throw profileInsertError
      }

      return jsonResponse({
        user: {
          id: created.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role,
          permissions,
          branch_id: userData.branch_id || null,
          pin_code_configured: true
        }
      })
    }

    if (action === 'list_subscriptions') {
      const licenseAdminError = requireLicenseAdmin(callerEmail)
      if (licenseAdminError) {
        console.error('[admin-service] list_subscriptions rejected for non-admin caller:', callerEmail)
        return licenseAdminError
      }
      console.log('[admin-service] Listing subscriptions')
      const { data: subscriptions, error } = await adminClient
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[admin-service] list_subscriptions error:', error)
        throw error
      }
      console.log('[admin-service] Subscriptions count:', subscriptions?.length)
      return jsonResponse({ subscriptions: subscriptions || [] })
    }

    if (action === 'create_license_user') {
      const licenseAdminError = requireLicenseAdmin(callerEmail)
      if (licenseAdminError) {
        console.error('[admin-service] create_license_user rejected for non-admin caller:', callerEmail)
        return licenseAdminError
      }
      console.log('[admin-service] create_license_user userData:', userData)
      const missing = []
      if (!userData.full_name) missing.push('full_name')
      if (!userData.email) missing.push('email')
      if (!userData.password) missing.push('password')
      if (missing.length > 0) {
        console.error('[admin-service] create_license_user missing fields:', missing)
        return jsonResponse({
          error: 'Campos requeridos faltantes',
          missing,
          receivedUserData: userData
        }, 400)
      }

      console.log('[admin-service] Creating auth user for:', userData.email)
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { full_name: userData.full_name }
      })

      if (createError) {
        console.error('[admin-service] createUser error:', createError)
        throw createError
      }
      if (!created.user) {
        console.error('[admin-service] createUser returned no user')
        throw new Error('No se pudo crear usuario')
      }

      console.log('[admin-service] Auth user created:', created.user.id)

      console.log('[admin-service] Creating profile for license user')
      const { error: profileError } = await adminClient.from('profiles').insert({
        id: created.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: 'admin',
        is_active: true,
        permissions: normalizePermissions('admin'),
        branch_id: null,
        updated_at: new Date().toISOString()
      })

      if (profileError) {
        console.error('[admin-service] profile insert error:', profileError)
        await adminClient.auth.admin.deleteUser(created.user.id)
        throw profileError
      }

      console.log('[admin-service] Profile created successfully')

      const { error: subscriptionError } = await adminClient.from('subscriptions').insert({
        user_id: created.user.id,
        email: userData.email,
        full_name: userData.full_name,
        status: 'active',
        activated_at: null,
        last_validated_at: null
      })

      if (subscriptionError) {
        console.error('[admin-service] subscription insert error:', subscriptionError)
        await adminClient.auth.admin.deleteUser(created.user.id)
        throw subscriptionError
      }

      console.log('[admin-service] License created successfully')
      return jsonResponse({
        created: true,
        user: { id: created.user.id, email: userData.email, full_name: userData.full_name }
      })
    }

    if (!userId) {
      console.error('[admin-service] userId required for action:', action)
      return jsonResponse({ error: 'userId requerido' }, 400)
    }

    if ((action === 'deactivate_user' || action === 'delete_user') && userId === callerData.user.id) {
      console.error('[admin-service] Cannot self-deactivate/delete')
      return jsonResponse({ error: 'No puedes desactivar o eliminar tu propio usuario' }, 400)
    }

    if (action === 'update_user') {
      const pinHash = userData.pin_code ? await hashPin(userData.pin_code) : undefined
      const role = userData.role || 'waiter'
      const updates: Record<string, unknown> = {
        full_name: userData.full_name,
        role,
        branch_id: userData.branch_id || null,
        permissions: normalizePermissions(role, userData.permissions),
        is_active: userData.is_active ?? true,
        updated_at: new Date().toISOString()
      }

      if (userData.email) updates.email = userData.email
      if (pinHash) {
        updates.pin_code_hash = pinHash
        updates.pin_code = userData.pin_code
      }

      const { error } = await adminClient.from('profiles').update(updates).eq('id', userId)
      if (error) throw error

      if (userData.email) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, { email: userData.email })
        if (authUpdateError) throw authUpdateError
      }

      return jsonResponse({ ok: true })
    }

    if (action === 'deactivate_user' || action === 'reactivate_user') {
      const isActive = action === 'reactivate_user'
      const { error } = await adminClient
        .from('profiles')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId)
      if (error) throw error
      return jsonResponse({ ok: true, is_active: isActive })
    }

    if (action === 'delete_user') {
      const checks = await Promise.all([
        adminClient.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        adminClient.from('payments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        adminClient.from('purchases').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ])
      const historyCount = checks.reduce((sum, result) => sum + (result.count || 0), 0)

      if (historyCount > 0) {
        return jsonResponse({
          deleted: false,
          reason: 'has_history',
          count: historyCount,
          message: 'El empleado tiene historial operativo; desactivalo para conservar reportes.'
        })
      }

      const { error: profileErrorDelete } = await adminClient.from('profiles').delete().eq('id', userId)
      if (profileErrorDelete) throw profileErrorDelete

      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)
      if (authDeleteError) throw authDeleteError

      return jsonResponse({ deleted: true })
    }

    const subscriptionId = payload.subscriptionId as string | undefined
    const updates = (payload.updates || {}) as Record<string, unknown>

    if (action === 'update_subscription') {
      const licenseAdminError = requireLicenseAdmin(callerEmail)
      if (licenseAdminError) {
        console.error('[admin-service] update_subscription rejected for non-admin caller:', callerEmail)
        return licenseAdminError
      }
      if (!subscriptionId) {
        console.error('[admin-service] update_subscription missing subscriptionId')
        return jsonResponse({ error: 'subscriptionId requerido' }, 400)
      }
      const { error } = await adminClient
        .from('subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)
      if (error) throw error
      return jsonResponse({ updated: true })
    }

    if (action === 'suspend_subscription') {
      const licenseAdminError = requireLicenseAdmin(callerEmail)
      if (licenseAdminError) {
        console.error('[admin-service] suspend_subscription rejected for non-admin caller:', callerEmail)
        return licenseAdminError
      }
      if (!subscriptionId) {
        console.error('[admin-service] suspend_subscription missing subscriptionId')
        return jsonResponse({ error: 'subscriptionId requerido' }, 400)
      }
      const { error } = await adminClient
        .from('subscriptions')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)
      if (error) throw error
      return jsonResponse({ suspended: true })
    }

    if (action === 'reactivate_subscription') {
      const licenseAdminError = requireLicenseAdmin(callerEmail)
      if (licenseAdminError) {
        console.error('[admin-service] reactivate_subscription rejected for non-admin caller:', callerEmail)
        return licenseAdminError
      }
      if (!subscriptionId) {
        console.error('[admin-service] reactivate_subscription missing subscriptionId')
        return jsonResponse({ error: 'subscriptionId requerido' }, 400)
      }
      const { error } = await adminClient
        .from('subscriptions')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)
      if (error) throw error
      return jsonResponse({ reactivated: true })
    }

    console.error('[admin-service] Unsupported action:', action)
    return jsonResponse({ error: 'Accion no soportada', action }, 400)
  } catch (error) {
    console.error('[admin-service] Unhandled error:', error)
    return jsonResponse({ error: error.message || 'Error interno' }, 500)
  }
})
