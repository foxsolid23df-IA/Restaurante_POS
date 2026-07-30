import { useEffect } from 'react'
import { isElectron } from '@/lib/electronBridge'
import useOfflineStore from '@/store/offlineStore'

export default function OfflineStatusBar() {
  const isOnline = useOfflineStore((s) => s.isOnline)
  const pendingChanges = useOfflineStore((s) => s.pendingChanges)
  const isSyncing = useOfflineStore((s) => s.isSyncing)
  const lastSyncAt = useOfflineStore((s) => s.lastSyncAt)
  const triggerSync = useOfflineStore((s) => s.triggerSync)

  useEffect(() => {
    if (isElectron) {
      useOfflineStore.getState().startAutoSync()
    }
    return () => {
      useOfflineStore.getState().stopAutoSync()
    }
  }, [])

  if (!isElectron) return null

  return (
    <div className={`w-full text-center text-[10px] font-bold tracking-wider uppercase py-1.5 transition-all duration-300 ${
      isOnline
        ? pendingChanges > 0
          ? 'bg-amber-50 text-amber-700 border-b border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
        : 'bg-red-50 text-red-700 border-b border-red-200'
    }`}>
      <span className="flex items-center justify-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${
          isOnline ? (pendingChanges > 0 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-red-500'
        }`} />
        {isOnline ? (
          <>
            {pendingChanges > 0 ? (
              <>
                {pendingChanges} cambio{pendingChanges !== 1 ? 's' : ''} pendiente{pendingChanges !== 1 ? 's' : ''} de sincronizar
              </>
            ) : (
              <>
                En linea
                {lastSyncAt && (
                  <span className="text-emerald-500/70 ml-1">
                    (sync: {new Date(lastSyncAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </>
            )}
            {isSyncing ? (
              <span className="animate-pulse ml-1">- sincronizando...</span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); triggerSync() }}
                className="underline hover:text-amber-800 ml-1"
              >
                sincronizar ahora
              </button>
            )}
          </>
        ) : (
          'Sin conexion - trabajando offline'
        )}
      </span>
    </div>
  )
}
