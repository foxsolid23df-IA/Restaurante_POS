import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import os from 'os'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '../shared/supabase.config.js'

const LICENSE_FILE = 'license.json'
const REVALIDATION_DAYS = 30
const GRACE_PERIOD_DAYS = 5

function getLicensePath() {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  return join(userDataPath, LICENSE_FILE)
}

export function getMachineId() {
  const parts = [os.hostname(), (os.cpus()[0] || {}).model || 'unknown', os.totalmem().toString(), os.platform(), os.arch()]
  return crypto.createHash('sha256').update(parts.join('-')).digest('hex').slice(0, 32)
}

export function getLicense() {
  try {
    const path = getLicensePath()
    if (!existsSync(path)) return null
    const data = readFileSync(path, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function saveLicense(data) {
  const path = getLicensePath()
  const existing = getLicense() || {}
  const merged = { ...existing, ...data }
  writeFileSync(path, JSON.stringify(merged, null, 2))
}

export function clearLicense() {
  const path = getLicensePath()
  if (existsSync(path)) {
    try {
      writeFileSync(path, '{}')
    } catch {
      // ignore
    }
  }
}

export function isActivated() {
  const license = getLicense()
  return !!(license && license.email && license.userId && license.machineId && license.activatedAt)
}

export function needsRevalidation() {
  const license = getLicense()
  if (!license || !license.lastValidatedAt) return true

  const lastValidated = new Date(license.lastValidatedAt)
  const now = new Date()
  const diffDays = (now - lastValidated) / (1000 * 60 * 60 * 24)

  return diffDays >= REVALIDATION_DAYS
}

export function isInGracePeriod() {
  const license = getLicense()
  if (!license || !license.lastValidatedAt) return false

  const lastValidated = new Date(license.lastValidatedAt)
  const now = new Date()
  const diffDays = (now - lastValidated) / (1000 * 60 * 60 * 24)

  return diffDays < REVALIDATION_DAYS + GRACE_PERIOD_DAYS
}

export function isGraceExpired() {
  const license = getLicense()
  if (!license || !license.lastValidatedAt) return true

  const lastValidated = new Date(license.lastValidatedAt)
  const now = new Date()
  const diffDays = (now - lastValidated) / (1000 * 60 * 60 * 24)

  return diffDays >= REVALIDATION_DAYS + GRACE_PERIOD_DAYS
}

function getSupabaseClient() {
  const options = {}
  if (SUPABASE_SERVICE_ROLE_KEY) {
    options.auth = { persistSession: false }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options)
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
}

export async function activateLicense(email, password) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) {
    return { success: false, error: authError.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : authError.message }
  }

  const userId = authData.user.id
  const machineId = getMachineId()

  const sessionData = {
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    expires_at: authData.session.expires_at
  }

  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (subError && subError.code !== 'PGRST116') {
    return { success: false, error: 'Error al verificar suscripción' }
  }

  if (subData) {
    if (subData.status === 'suspended') {
      return { success: false, error: 'Esta licencia ha sido suspendida. Contacte al administrador.' }
    }
    if (subData.status === 'expired') {
      return { success: false, error: 'Esta licencia ha expirado. Contacte al administrador.' }
    }

    if (subData.machine_id && subData.machine_id !== machineId) {
      return { success: false, error: 'Esta licencia ya está activada en otro equipo. Desactívela primero.' }
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ machine_id: machineId, last_validated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
    }
  } else {
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        email,
        machine_id: machineId,
        status: 'active',
        activated_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error creating subscription:', insertError)
    }
  }

  const licenseData = {
    email,
    userId,
    machineId,
    activatedAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    session: sessionData
  }

  saveLicense(licenseData)

  return { success: true }
}

export async function revalidateLicense() {
  const license = getLicense()
  if (!license || !license.session) {
    return { valid: false, reason: 'no_license' }
  }

  const machineId = getMachineId()
  if (license.machineId !== machineId) {
    return { valid: false, reason: 'machine_mismatch' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

  let validSession = null
  try {
    const { data: setData, error: setError } = await supabase.auth.setSession({
      access_token: license.session.access_token,
      refresh_token: license.session.refresh_token
    })

    if (setError) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: license.session.refresh_token
      })

      if (refreshError) {
        return { valid: false, reason: 'session_expired' }
      }

      validSession = refreshData.session
    } else {
      validSession = setData.session
    }

    if (!validSession) {
      return { valid: false, reason: 'session_expired' }
    }

    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', license.userId)
      .maybeSingle()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error querying subscription:', subError)
      return { valid: false, reason: 'query_error' }
    }

    if (!subData) {
      return { valid: false, reason: 'subscription_not_found' }
    }

    if (subData.status !== 'active') {
      return { valid: false, reason: `subscription_${subData.status}` }
    }

    const newSession = {
      access_token: validSession.access_token,
      refresh_token: validSession.refresh_token,
      expires_at: validSession.expires_at
    }

    saveLicense({
      lastValidatedAt: new Date().toISOString(),
      session: newSession
    })

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ last_validated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', license.userId)

    if (updateError) {
      console.error('Error updating subscription last_validated_at:', updateError)
    }

    return { valid: true }
  } catch (error) {
    console.error('Revalidation error:', error)
    return { valid: false, reason: 'network_error' }
  }
}

export function getLicenseInfo() {
  const license = getLicense()
  if (!license) return { activated: false }

  const needsRev = needsRevalidation()
  const inGrace = isInGracePeriod()
  const graceExpired = isGraceExpired()

  return {
    activated: true,
    email: license.email,
    activatedAt: license.activatedAt,
    lastValidatedAt: license.lastValidatedAt,
    machineId: license.machineId,
    needsRevalidation: needsRev,
    inGracePeriod: inGrace,
    graceExpired
  }
}
