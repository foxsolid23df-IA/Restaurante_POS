import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Delete, LogIn } from 'lucide-react'

export default function PINLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { updateProfile } = useAuthStore()

  // Usuarios mockeados para prueba temporal
  const mockUsers = [
    { 
      id: '1',
      full_name: 'Administrador', 
      pin_code: '1111', 
      is_active: true, 
      role: 'admin' 
    },
    { 
      id: '2',
      full_name: 'Gerente', 
      pin_code: '2222', 
      is_active: true, 
      role: 'manager' 
    }
  ]

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

    setLoading(true)
    setError('')

    try {
      console.log('Buscando perfil con PIN:', pin)
      
      // Buscar en usuarios mockeados
      const profile = mockUsers.find(user => 
        user.pin_code === pin && user.is_active
      )

      console.log('Resultado de búsqueda:', { profile })

      if (!profile) {
        console.log('Perfil no encontrado')
        setError('PIN incorrecto o usuario inactivo')
        setPin('')
        setLoading(false)
        return
      }

      // Actualizar el store con el perfil
      updateProfile(profile)
      
      // Redirigir según el rol
      if (profile.role === 'admin' || profile.role === 'manager') {
        navigate('/dashboard')
      } else {
        navigate('/orders') // Meseros y cajeros van directo al POS
      }
    } catch (err) {
      console.error('Error en login por PIN:', err)
      setError('Error al iniciar sesión')
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

          {/* Debug Panel - Remove in production */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold mb-2">Usuarios disponibles:</h3>
            {mockUsers.map((user, idx) => (
              <div key={idx} className="border-b pb-1 mb-1">
                <p>{user.full_name} - PIN: {user.pin_code} - Rol: {user.role}</p>
              </div>
            ))}
            <p className="mt-2 font-bold">PIN ingresado: {pin}</p>
          </div>
        </div>
      </div>
    </div>
  )
}