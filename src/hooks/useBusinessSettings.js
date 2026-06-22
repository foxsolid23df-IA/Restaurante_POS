import { create } from 'zustand'
import { settingsApi } from '@/features/settings/api/settingsApi'

export const useBusinessStore = create((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const data = await settingsApi.getBusinessSettings()
      set({ settings: data, loading: false })
      return data
    } catch (err) {
      console.error('Error fetching settings:', err)
      set({ error: err.message, loading: false })
      return null
    }
  },

  updateSettings: async (newSettings) => {
    set({ loading: true, error: null })
    try {
      const data = await settingsApi.updateBusinessSettings(newSettings)
      set({ settings: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  }
}))
