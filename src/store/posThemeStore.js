import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePosThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: Boolean(value) })
    }),
    {
      name: 'pos-theme'
    }
  )
)
