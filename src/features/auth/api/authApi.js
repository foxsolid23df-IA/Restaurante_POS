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
        if (isElectron) {
            const pinHash = await hashPin(pin)
            const rows = await localDb.query(
                `SELECT id, full_name, role, is_active, branch_id, permissions, pin_code, pin_code_hash
                 FROM profiles
                 WHERE is_active = 1 AND (pin_code = ? OR pin_code_hash = ?)`,
                [pin, pinHash]
            )

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

            // Fallback a Supabase si el PIN no existe localmente (nuevo empleado)
            try {
                const { data: profile, error } = await supabase.rpc('verify_pin', { p_pin: pin })
                if (error || !profile) throw new Error('PIN incorrecto')

                const result = Array.isArray(profile) ? profile[0] : profile
                if (!result) throw new Error('PIN incorrecto')

                // Guardar perfil localmente para futuros logins offline
                await localDb.run(
                    `INSERT OR REPLACE INTO profiles (id, full_name, role, pin_code, pin_code_hash, is_active, email, permissions, branch_id, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [result.id, result.full_name, result.role, pin, pinHash, 1, null, JSON.stringify(result.permissions || {}), result.branch_id || null, new Date().toISOString(), new Date().toISOString()]
                )

                return result
            } catch (e) {
                throw new Error('PIN incorrecto o sin conexion')
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
