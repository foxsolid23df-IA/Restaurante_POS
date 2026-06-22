import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!profile?.is_active) {
          await supabase.auth.signOut()
          localStorage.removeItem('pos_profile')
          set({ user: null, profile: null, loading: false })
          return
        }

        set({ user: session.user, profile, loading: false })
        return
      }

      const savedProfile = localStorage.getItem('pos_profile')
      if (savedProfile) {
        try {
          set({ user: null, profile: JSON.parse(savedProfile), loading: false })
        } catch {
          localStorage.removeItem('pos_profile')
          set({ user: null, profile: null, loading: false })
        }
        return
      }

      set({ user: null, profile: null, loading: false })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, profile: null, loading: false })
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_active) {
      await supabase.auth.signOut()
      throw new Error('Usuario inactivo')
    }

    set({ user: data.user, profile })
    return { user: data.user, profile }
  },

  signInWithPin: async (pin) => {
    const { data: profile, error } = await supabase
      .rpc('verify_pin', { p_pin: pin })
      .single()

    if (error || !profile) throw new Error('PIN incorrecto')

    localStorage.setItem('pos_profile', JSON.stringify(profile))
    set({ user: null, profile })
    return profile
  },

  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('pos_profile')
    set({ user: null, profile: null })
    window.location.href = '/pin-login'
  },

  updateProfile: (profile) => set({ profile })
}))
