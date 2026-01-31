import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useBusinessStore = create((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        // Create initial default if empty
        const { data: newData, error: insertError } = await supabase
          .from('business_settings')
          .insert([{ name: 'Mi Restaurante', tax_rate: 0.16, tax_name: 'IVA' }])
          .select()
          .single()
        
        if (insertError) throw insertError
        set({ settings: newData, loading: false })
      } else {
        set({ settings: data[0], loading: false })
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      set({ error: err.message, loading: false })
    }
  },

  updateSettings: async (newSettings) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .update(newSettings)
        .eq('id', newSettings.id)
        .select()
        .single()
      
      if (error) throw error
      set({ settings: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))
