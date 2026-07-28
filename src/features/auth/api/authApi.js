import { supabase } from '@/lib/supabase'
import { isElectron, db as localDb } from '@/lib/electronBridge'

const hashPin = async (pin) => {
  const data = new TextEncoder().encode(pin)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

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

        if (isElectron) {
            // Intentar sincronizar perfiles activos desde Supabase antes de validar
            try {
                console.log('[signInWithPin] Syncing profiles from Supabase...')
                const { data: profiles, error: syncError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('is_active', true)

                if (!syncError && profiles && profiles.length > 0) {
                    for (const profile of profiles) {
                        await localDb.run(
                            `INSERT OR REPLACE INTO profiles (id, full_name, role, pin_code, pin_code_hash, is_active, email, permissions, branch_id, created_at, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                profile.id,
                                profile.full_name,
                                profile.role,
                                profile.pin_code || null,
                                profile.pin_code_hash || null,
                                profile.is_active ? 1 : 0,
                                profile.email || null,
                                JSON.stringify(profile.permissions || {}),
                                profile.branch_id || null,
                                profile.created_at || new Date().toISOString(),
                                profile.updated_at || new Date().toISOString()
                            ]
                        )
                    }
                    console.log(`[signInWithPin] Synced ${profiles.length} profiles`)
                } else if (syncError) {
                    console.warn('[signInWithPin] Could not sync profiles:', syncError.message)
                }
            } catch (syncErr) {
                console.warn('[signInWithPin] Sync error (offline?):', syncErr.message)
            }

            // Verificar PIN localmente
            const rows = await localDb.query(
                `SELECT id, full_name, role, is_active, branch_id, permissions, pin_code, pin_code_hash
                 FROM profiles
                 WHERE is_active = 1 AND (pin_code = ? OR pin_code_hash = ?)`,
                [pin, pinHash]
            )

            console.log('[signInWithPin] Local rows found:', rows?.length)

            if (rows && rows.length > 0) {
                const profile = rows[0]
                return {
                    id: profile.id,
                    full_name: profile.full_name,
                    role: profile.role,
                    is_active: profile.is_active === 1,
                    branch_id: profile.branch_id,
                    permissions: typeof profile.permissions === 'string' ? JSON.parse(profile.permissions) : profile.permissions
                }
            }

            console.error('[signInWithPin] PIN not found locally after sync. Pin:', pin)
            throw new Error('PIN incorrecto')
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
