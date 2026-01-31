import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Shield, Key } from 'lucide-react'

export default function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'waiter',
    pin_code: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role || 'waiter',
        pin_code: user.pin_code || '',
        is_active: user.is_active ?? true
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (user) {
        // Actualizar perfil existente
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', user.id)
        if (error) throw error
      } else {
        alert("Para crear un nuevo usuario se requiere registro de correo. Por ahora editaremos los perfiles existentes. En el siguiente paso implementaremos la creación completa.")
        return
      }

      onSave()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error al guardar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} />
            {user ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Rol en el Restaurante</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="admin">Administrador (Control Total)</option>
              <option value="manager">Gerente (Inventario y Mesas)</option>
              <option value="captain">Capitán (Control de Mesas)</option>
              <option value="waiter">Mesero (Solo Órdenes)</option>
              <option value="cashier">Cajero (Caja y Pagos)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <Key size={16} />
              PIN de Acceso Rápido (4 dígitos)
            </label>
            <input
              type="text"
              maxLength="4"
              pattern="\d{4}"
              required
              value={formData.pin_code}
              onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg tracking-[1em] text-center font-bold text-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="0000"
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 select-none">Cuenta Activa</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
