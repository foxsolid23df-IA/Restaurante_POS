import { useState, useEffect, useCallback } from 'react'
import { isElectron, updater } from '@/lib/electronBridge'

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isElectron) return

    const cleanupAvailable = updater.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setDismissed(false)
    })

    const cleanupDownloaded = updater.onUpdateDownloaded((info) => {
      setDownloadComplete(true)
      setUpdateInfo((prev) => prev || info)
    })

    const cleanupProgress = updater.onDownloadProgress((progress) => {
      setDownloadProgress(Math.round(progress.percent || 0))
    })

    return () => {
      cleanupAvailable?.()
      cleanupDownloaded?.()
      cleanupProgress?.()
    }
  }, [])

  const handleCheck = useCallback(async () => {
    setChecking(true)
    setCheckError(null)
    try {
      const result = await updater.check()
      if (result && result.updateInfo) {
        setUpdateInfo(result.updateInfo)
      }
    } catch (e) {
      setCheckError(e.message || 'Error al buscar actualizaciones')
    } finally {
      setChecking(false)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    try {
      await updater.install()
    } catch (e) {
      setCheckError(e.message || 'Error al instalar actualizacion')
    }
  }, [])

  if (!isElectron || dismissed || (!updateInfo && !checkError)) return null

  const isCheckingOnly = checking && !updateInfo

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center shrink-0">
              {isCheckingOnly ? (
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <span className="material-symbols-outlined text-white text-sm">
                  {downloadComplete ? 'restart_alt' : 'system_update'}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950 tracking-tight">
                {downloadComplete
                  ? 'Actualizacion lista'
                  : updateInfo
                    ? 'Actualizacion disponible'
                    : 'Buscando...'}
              </h3>
              {updateInfo && (
                <p className="text-xs text-slate-500 mt-0.5">
                  v{updateInfo.version}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-slate-500 text-sm">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {downloadComplete ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                La actualizacion se descargo. Reinicia para aplicar los cambios.
              </p>
              <button
                onClick={handleInstall}
                className="w-full py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:bg-slate-900 transition-all shadow-lg shadow-slate-950/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reiniciar ahora
              </button>
            </div>
          ) : updateInfo ? (
            <div className="space-y-3">
              {downloadProgress > 0 && downloadProgress < 100 ? (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                    <span>Descargando</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-950 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Nueva version v{updateInfo.version} disponible. Se descargara automaticamente.
                </p>
              )}
            </div>
          ) : checkError ? (
            <p className="text-sm text-red-600">{checkError}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full" />
              Verificando actualizaciones...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
