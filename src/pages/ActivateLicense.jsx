import { useState } from 'react'
import { Lock, Mail, ShieldCheck } from 'lucide-react'

export default function ActivateLicense() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  const isElectron = !!(typeof window !== 'undefined' && window.electronAPI?.app?.isElectron)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isElectron || !window.electronAPI?.license) {
        setError('La activación solo está disponible en la aplicación de escritorio')
        setLoading(false)
        return
      }

      const result = await window.electronAPI.license.activate(email, password)

      if (!result.success) {
        setError(result.error || 'Error al activar la licencia')
        setLoading(false)
        return
      }

      setActivated(true)
    } catch (err) {
      setError(err.message || 'Error al activar la licencia')
    } finally {
      setLoading(false)
    }
  }

  if (activated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Licencia Activada</h1>
            <p className="text-slate-600 mb-2">La aplicación se abrirá automáticamente.</p>
            <p className="text-sm text-slate-400">Si no abre, reinicie la aplicación manualmente.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isElectron) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Activación de Licencia</h1>
            <p className="text-slate-600">La activación solo está disponible desde la aplicación de escritorio.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="text-blue-600" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Activar Licencia</h1>
            <p className="text-slate-600 text-sm">Ingrese las credenciales de su cuenta para activar el software en este equipo.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="usuario@ejemplo.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Activando...' : 'Activar Licencia'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            La licencia se vincula a este equipo. Para transferirla a otro equipo, contacte al administrador.
          </p>
        </div>
      </div>
    </div>
  )
}
