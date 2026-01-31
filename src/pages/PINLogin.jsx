import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Delete, LogIn } from 'lucide-react'

export default function PINLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signInWithPin } = useAuthStore()
 
  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      setPin(pin + num)
      setError('')
    }
  }
 
  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }
 
  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('Ingresa un PIN de 4 dígitos')
      return
    }
 
    try {
      setLoading(true)
      setError('')
      
      console.log('Verificando PIN...')
      const profile = await signInWithPin(pin)
      console.log('Login exitoso:', profile)
 
      // Redirigir según el rol
      if (profile.role === 'admin' || profile.role === 'manager') {
        navigate('/admin')
      } else {
        navigate('/pos/tables')
      }
    } catch (err) {
      console.error('Error en login por PIN:', err)
      setError(err.message || 'Error al iniciar sesión')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Acceso Rápido</h1>
            <p className="text-slate-500 mt-2 font-medium">Ingresa tu PIN de 4 dígitos</p>
          </div>

          {/* PIN Display */}
          <div className="mb-8">
            <div className="flex justify-center gap-4 mb-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all ${
                    pin.length > i
                      ? 'bg-blue-600 border-blue-600 text-white scale-110'
                      : 'bg-slate-50 border-slate-200 text-slate-300'
                  }`}
                >
                  {pin.length > i ? '●' : '○'}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-red-600 text-sm text-center font-bold mt-3 animate-pulse">{error}</p>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                disabled={loading}
                className="h-16 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-900 text-2xl font-black rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-16 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 flex items-center justify-center"
            >
              <Delete size={24} />
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              className="h-16 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-900 text-2xl font-black rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || pin.length !== 4}
              className="h-16 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 font-black text-sm flex items-center justify-center gap-2"
            >
              {loading ? '...' : 'ENTRAR'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Usar correo y contraseña →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
