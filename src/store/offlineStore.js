import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isElectron } from '@/lib/electronBridge'
import { localDb } from '@/lib/localDb'

const useOfflineStore = create(
  persist(
    (set, get) => ({
      isOnline: !isElectron || navigator.onLine,
      lastSyncAt: null,
      pendingChanges: 0,
      syncInterval: 30000,
      isSyncing: false,
      syncError: null,
      consecutiveFailures: 0,

      setOnline: (online) => set({ isOnline: online }),

      setSyncInterval: (ms) => set({ syncInterval: ms }),

      refreshSyncStatus: async () => {
        if (!isElectron) return
        try {
          const status = await localDb.getSyncStatus()
          set({
            pendingChanges: status.pending || 0,
            lastSyncAt: status.pending === 0 ? new Date().toISOString() : get().lastSyncAt
          })
        } catch (e) {
          console.warn('Failed to get sync status:', e)
        }
      },

      triggerSync: async () => {
        const { isSyncing, isOnline } = get()
        if (isSyncing || !isElectron || !isOnline) return

        set({ isSyncing: true, syncError: null })
        try {
          await localDb.syncNow()
          set({
            isSyncing: false,
            pendingChanges: 0,
            lastSyncAt: new Date().toISOString(),
            consecutiveFailures: 0
          })
        } catch (e) {
          set({
            isSyncing: false,
            syncError: e.message,
            consecutiveFailures: get().consecutiveFailures + 1
          })
        }
      },

      startAutoSync: () => {
        const { syncInterval } = get()
        const existing = get()._autoSyncTimer
        if (existing) clearInterval(existing)

        if (isElectron && syncInterval > 0) {
          const timer = setInterval(() => {
            get().triggerSync()
          }, syncInterval)
          set({ _autoSyncTimer: timer })
        }
      },

      stopAutoSync: () => {
        const timer = get()._autoSyncTimer
        if (timer) {
          clearInterval(timer)
          set({ _autoSyncTimer: null })
        }
      }
    }),
    {
      name: 'offline-store',
      partialize: (state) => ({
        syncInterval: state.syncInterval,
        lastSyncAt: state.lastSyncAt,
        pendingChanges: state.pendingChanges
      })
    }
  )
)

// Initialize network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOfflineStore.getState().setOnline(true))
  window.addEventListener('offline', () => useOfflineStore.getState().setOnline(false))
}

export default useOfflineStore
