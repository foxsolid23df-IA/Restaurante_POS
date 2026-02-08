import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, LogIn, Keypad } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

export default function PINLoginForm() {
  const [pin, setPin] = useState('')
  const navigate = useNavigate()
  const { loginWithPin, isLoggingIn } = useAuth()
 
  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
    }
  }
 
  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }
 
  const handleSubmit = async () => {
    if (pin.length !== 4) {
      toast.error('Ingresa un PIN de 4 dígitos')
      return
    }
 
    try {
      const profile = await loginWithPin(pin)
      toast.success(`Bienvenido, ${profile.full_name || 'Usuario'}`)
      
      if (profile.role === 'admin' || profile.role === 'manager') {
        navigate('/admin')
      } else {
        navigate('/pos/tables')
      }
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión')
      setPin('')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass-dark rounded-[2rem] p-10 shadow-2xl relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative">
          <div className="bg-gradient-to-tr from-blue-600 to-blue-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <LogIn className="text-white" size={36} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Acceso Rápido</h1>
          <p className="text-slate-400 mt-2 font-medium">Ingresa tu código de seguridad</p>
        </div>

        {/* PIN Display */}
        <div className="mb-10 relative">
          <div className="flex justify-center gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all duration-300 ${
                  pin.length > i
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/40 scale-110'
                    : 'bg-white/5 border-white/10 text-white/20'
                }`}
              >
                {pin.length > i ? '●' : '○'}
              </div>
            ))}
          </div>
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-8 relative">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={isLoggingIn}
              className="h-16 glass-dark hover:bg-white/10 text-white text-2xl font-bold rounded-2xl transition-all active:scale-90 disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={isLoggingIn || pin.length === 0}
            className="h-16 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
          >
            <Delete size={28} />
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            disabled={isLoggingIn}
            className="h-16 glass-dark hover:bg-white/10 text-white text-2xl font-bold rounded-2xl transition-all active:scale-90"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoggingIn || pin.length !== 4}
            className="h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-30 flex items-center justify-center"
          >
            {isLoggingIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            ) : (
              <span className="font-black text-sm tracking-widest uppercase">Entrar</span>
            )}
          </button>
        </div>

        <div className="text-center relative">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
          >
            <span>Usar credenciales completas</span>
            <span className="text-xs">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
