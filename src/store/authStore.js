import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        set({ user: session.user, profile, loading: false })
      } else {
        const savedProfile = localStorage.getItem('pos_profile')
        if (savedProfile) {
          try {
            set({ user: null, profile: JSON.parse(savedProfile), loading: false })
          } catch (e) {
            localStorage.removeItem('pos_profile')
            set({ user: null, profile: null, loading: false })
          }
        } else {
          set({ user: null, profile: null, loading: false })
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },

  // Sign in with email/password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    set({ user: data.user, profile })
    return { user: data.user, profile }
  },

  // Sign in with PIN
  signInWithPin: async (pin) => {
    const { data: profile, error } = await supabase
      .rpc('verify_pin', { p_pin: pin })
      .single()
    
    if (error || !profile) throw new Error('PIN incorrecto')
    
    // Persistir para cambios de página
    localStorage.setItem('pos_profile', JSON.stringify(profile))
    set({ profile })
    return profile
  },

  // Sign out
  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('pos_profile')
    set({ user: null, profile: null })
    // Redirigir a pantalla de Acceso Rápido
    window.location.href = '/pin-login'
  },

  // Update profile
  updateProfile: (profile) => set({ profile }),
}))
