import { supabase } from '@/lib/supabase'
import { isElectron, db as localDb, logger } from '@/lib/electronBridge'

const log = (level, message) => {
    console.log(`[signInWithPin] ${message}`)
    if (isElectron && logger?.write) {
        logger.write(level, `[signInWithPin] ${message}`).catch(() => {})
    }
}

const hashPin = async (pin) => {
    const data = new TextEncoder().encode(pin)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const queryLocalProfileByPin = async (pin, pinHash) => {
    const rows = await localDb.query(
        `SELECT id, full_name, role, is_active, branch_id, permissions, pin_code, pin_code_hash
         FROM profiles
         WHERE is_active = 1 AND (pin_code = ? OR pin_code_hash = ?)`,
        [pin, pinHash]
    )
    return rows || []
}

// Fallback that also checks plain-text pin_code locally
const queryLocalProfileByPlainPin = async (pin) => {
    const rows = await localDb.query(
        `SELECT id, full_name, role, is_active, branch_id, permissions, pin_code, pin_code_hash
         FROM profiles
         WHERE is_active = 1 AND pin_code = ?`,
        [pin]
    )
    return rows || []
}

const upsertLocalProfile = async (profile, pin = null, pinHash = null) => {
    await localDb.run(
        `INSERT OR REPLACE INTO profiles (id, full_name, role, pin_code, pin_code_hash, is_active, email, permissions, branch_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            profile.id,
            profile.full_name,
            profile.role,
            pin || profile.pin_code || null,
            pinHash || profile.pin_code_hash || null,
            profile.is_active ? 1 : 0,
            profile.email || null,
            JSON.stringify(profile.permissions || {}),
            profile.branch_id || null,
            profile.created_at || new Date().toISOString(),
            profile.updated_at || new Date().toISOString()
        ]
    )
}

const syncProfilesFromSupabase = async () => {
    log('INFO', 'Syncing profiles from Supabase...')
    const { data: profiles, error: syncError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)

    if (syncError) {
        log('ERROR', `Could not sync profiles: ${syncError.message}`)
        throw new Error(`Sync error: ${syncError.message}`)
    }

    if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
            await upsertLocalProfile(profile)
        }
        log('INFO', `Synced ${profiles.length} profiles`)
    } else {
        log('WARN', 'No active profiles returned from Supabase')
    }
}

const profileFromRow = (row) => ({
    id: row.id,
    full_name: row.full_name,
    role: row.role,
    is_active: row.is_active === 1,
    branch_id: row.branch_id,
    permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions
})

export const authApi = {
    getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session
    },

    getProfile: async (userId) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        return profile
    },

    signInWithPassword: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    },

    signInWithPin: async (pin) => {
        const pinHash = await hashPin(pin)
        log('INFO', `Attempting PIN login, pin length: ${pin.length}`)

        if (isElectron) {
            // 1. Always try local first
            const localRows = await queryLocalProfileByPin(pin, pinHash)
            log('INFO', `Local rows found: ${localRows.length}`)

            if (localRows.length > 0) {
                log('INFO', `Local PIN match: ${localRows[0].full_name}`)
                return profileFromRow(localRows[0])
            }

            // 2. Local miss - try to sync if online
            let online = false
            try {
                online = await localDb.isOnline()
                log('INFO', `Online status: ${online}`)
            } catch (e) {
                log('ERROR', `Error checking online status: ${e.message}`)
            }

            if (!online) {
                log('ERROR', 'PIN not found locally and device is offline')
                throw new Error('PIN no encontrado. El dispositivo está sin conexión y el PIN no está sincronizado localmente.')
            }

            try {
                await syncProfilesFromSupabase()
                const syncedRows = await queryLocalProfileByPin(pin, pinHash)
                log('INFO', `Local rows after sync: ${syncedRows.length}`)
                if (syncedRows.length > 0) {
                    log('INFO', `PIN match after sync: ${syncedRows[0].full_name}`)
                    return profileFromRow(syncedRows[0])
                }
            } catch (syncErr) {
                log('ERROR', `Failed to sync profiles: ${syncErr.message}`)
                throw new Error(`No se pudo sincronizar el PIN: ${syncErr.message}`)
            }

            // 3. Sync succeeded but PIN still not found - verify directly via RPC
            log('WARN', 'PIN not found locally after sync, trying remote verify_pin')
            try {
                const { data: remoteProfile, error: remoteError } = await supabase.rpc('verify_pin', { p_pin: pin })
                if (remoteError) {
                    log('ERROR', `verify_pin error: ${remoteError.message}`)
                    throw new Error(`Supabase: ${remoteError.message}`)
                }
                const result = Array.isArray(remoteProfile) ? remoteProfile[0] : remoteProfile
                if (!result) {
                    log('ERROR', 'verify_pin returned no profile')
                    throw new Error('PIN incorrecto')
                }
                log('INFO', `verify_pin success: ${result.full_name || result.id}`)
                await upsertLocalProfile(result, pin, pinHash)
                return result
            } catch (fallbackErr) {
                log('ERROR', `Remote verify failed: ${fallbackErr.message}`)

                // Last resort: try plain-text pin_code locally (useful when pgcrypto is missing in Supabase)
                const plainRows = await queryLocalProfileByPlainPin(pin)
                if (plainRows.length > 0) {
                    log('INFO', `Plain-text PIN match: ${plainRows[0].full_name}`)
                    return profileFromRow(plainRows[0])
                }

                throw new Error(fallbackErr.message)
            }
        }

        const { data: profile, error } = await supabase
            .rpc('verify_pin', { p_pin: pin })

        if (error) throw error
        // Note: rpc might return an array or single object depending on definition
        const result = Array.isArray(profile) ? profile[0] : profile
        if (!result) throw new Error('PIN incorrecto')
        return result
    },

    signOut: async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('pos_profile')
    }
}
