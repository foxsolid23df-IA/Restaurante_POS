import { supabase } from '@/lib/supabase'

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
