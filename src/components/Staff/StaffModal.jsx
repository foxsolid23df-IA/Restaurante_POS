import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Shield, Key, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function StaffModal({ user, onClose, onSave }) {
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
        toast.success("Perfil de empleado actualizado")
      } else {
        toast.error("Para crear un nuevo usuario se requiere registro de correo en Supabase.")
        setLoading(false)
        return
      }

      onSave()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error al guardar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
        <div className="bg-slate-50 border-b border-slate-100 px-10 py-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="text-primary" size={28} />
              {user ? 'Configurar Perfil' : 'Registro de Personal'}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
               Ajusta roles, accesos y seguridad del colaborador
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-white p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Nombre Completo</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 text-lg transition-all"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Rol Administrativo</label>
            <div className="relative">
               <select
                 value={formData.role}
                 onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                 className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 transition-all appearance-none cursor-pointer"
               >
                 <option value="admin">Administrador (Control Total)</option>
                 <option value="manager">Gerente (Inventario y Mesas)</option>
                 <option value="captain">Capitán (Control de Mesas)</option>
                 <option value="waiter">Mesero (Solo Órdenes)</option>
                 <option value="cashier">Cajero (Caja y Pagos)</option>
               </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 flex items-center gap-2">
              <Key size={14} />
              PIN de Acceso Rápido (4 dígitos)
            </label>
            <div className="relative">
               <input
                 type="text"
                 maxLength="4"
                 pattern="\d{4}"
                 required
                 value={formData.pin_code}
                 onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
                 className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl tracking-[0.8em] text-center font-black text-3xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 placeholder:text-slate-200 transition-all"
                 placeholder="0000"
               />
            </div>
            <p className="text-[10px] text-slate-400 mt-3 px-2 font-medium">Este código se utiliza para el login rápido en el POS.</p>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
            <div>
               <p className="font-black text-slate-900 text-sm">Estado de la Cuenta</p>
               <p className="text-xs text-slate-500 font-medium mt-1">Habilita o revoca el acceso del empleado</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 text-slate-600 font-black hover:bg-slate-50 rounded-2xl transition-all text-sm uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-black shadow-2xl shadow-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              {loading ? (
                 <Loader2 className="animate-spin" size={20} />
              ) : (
                 <Save size={20} />
              )}
              {loading ? 'Sincronizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
