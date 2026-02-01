import { useState, useEffect } from 'react'
import { X, Shield, Key, Loader2, Save, Mail, Lock, Copy, Check, Layout, Package, Users as UsersIcon, BarChart3, Trash2, Tag, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBusinessStore } from '@/hooks/useBusinessSettings'

const DEFAULT_PERMISSIONS = {
  view_reports: false,
  manage_inventory: false,
  manage_staff: false,
  access_pos: true,
  access_admin: false,
  modify_prices: false,
  delete_orders: false
}

const ADMIN_PERMISSIONS = {
  view_reports: true,
  manage_inventory: true,
  manage_staff: true,
  access_pos: true,
  access_admin: true,
  modify_prices: true,
  delete_orders: true
}

const PERMISSION_LABELS = [
  { id: 'access_admin', label: 'Acceso Administración', icon: <Layout size={16}/>, color: 'indigo' },
  { id: 'access_pos', label: 'Acceso Punto de Venta (POS)', icon: <Shield size={16}/>, color: 'emerald' },
  { id: 'manage_inventory', label: 'Gestión de Inventarios', icon: <Package size={16}/>, color: 'blue' },
  { id: 'manage_staff', label: 'Gestión de Personal', icon: <UsersIcon size={16}/>, color: 'violet' },
  { id: 'view_reports', label: 'Reportes Financieros', icon: <BarChart3 size={16}/>, color: 'amber' },
  { id: 'modify_prices', label: 'Modificar Precios/Descuentos', icon: <Tag size={16}/>, color: 'rose' },
  { id: 'delete_orders', label: 'Eliminar Órdenes/Cuentas', icon: <Trash2 size={16}/>, color: 'red' },
]

export default function StaffModal({ user, onClose, onSave }) {
  const { settings, fetchSettings } = useBusinessStore()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'waiter',
    pin_code: '',
    is_active: true,
    permissions: { ...DEFAULT_PERMISSIONS }
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdData, setCreatedData] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!settings) fetchSettings()
  }, [settings, fetchSettings])

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '', 
        password: '',
        role: user.role || 'waiter',
        pin_code: user.pin_code || '',
        is_active: user.is_active ?? true,
        permissions: user.permissions || (user.role === 'admin' ? { ...ADMIN_PERMISSIONS } : { ...DEFAULT_PERMISSIONS })
      })
    } else {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'waiter',
        pin_code: '',
        is_active: true,
        permissions: { ...DEFAULT_PERMISSIONS }
      })
    }
  }, [user])

  const handleRoleChange = (role) => {
    const newPermissions = role === 'admin' ? { ...ADMIN_PERMISSIONS } : { ...DEFAULT_PERMISSIONS }
    setFormData(prev => ({ ...prev, role, permissions: newPermissions }))
  }

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permId]: !prev.permissions[permId]
      }
    }))
  }

  const handleCopyCredentials = () => {
    const text = `📋 CREDENCIALES DE ACCESO - ${settings?.name || 'Sistema POS'}\n\n` +
      `👤 Empleado: ${createdData.full_name}\n` +
      `📧 Email: ${createdData.email}\n` +
      `🔑 Contraseña: ${createdData.password}\n` +
      `🔢 PIN POS: ${createdData.pin_code}\n\n` +
      `Favor de guardar estos datos de forma segura.`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credenciales copiadas");
    setTimeout(() => setCopied(false), 2000);
  }

  const handleDeleteUser = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente a este empleado? Esta acción no se puede deshacer.')) return;
    
    setDeleting(true)
    try {
      const { error } = await supabase.functions.invoke('admin-service', {
        body: {
          action: 'delete_user',
          userId: user.id
        }
      })

      if (error) throw error
      toast.success("Empleado eliminado correctamente");
      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
             full_name: formData.full_name,
             role: formData.role,
             pin_code: formData.pin_code,
             is_active: formData.is_active,
             permissions: formData.permissions
          })
          .eq('id', user.id)
        
        if (error) {
          if (error.message?.includes('profiles_pin_code_key')) {
             throw new Error('Este código PIN ya está asignado a otro empleado. Por favor usa uno diferente.');
          }
          throw error;
        }
        
        toast.success("Perfil y permisos actualizados");
        onSave();
        onClose();
      } else {
        const { data, error } = await supabase.functions.invoke('admin-service', {
          body: {
            action: 'create_user',
            businessName: settings?.name || "Nuestro Restaurante",
            userData: {
              email: formData.email,
              password: formData.password,
              full_name: formData.full_name,
              role: formData.role,
              pin_code: formData.pin_code,
              permissions: formData.permissions
            }
          }
        })

        if (error) throw error
        if (data?.error) {
          if (data.error.includes('already exists') || data.error.includes('duplicate key')) {
             throw new Error('Ya existe un usuario con este correo electrónico o PIN.');
          }
          throw new Error(data.error)
        }
        
        setCreatedData({ ...formData, business_name: settings?.name || "Nuestro Restaurante" });
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess && createdData) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Empleado Registrado!</h2>
            <p className="text-slate-500 font-medium mb-8 text-sm px-4">Copia estos datos para el empleado.</p>

            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4 text-left mb-8 font-mono">
                <div className="text-xs break-all">
                  <span className="text-slate-400">Usuario:</span> <br/>
                  <span className="text-slate-900 font-bold">{createdData.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-xs">
                    <span className="text-slate-400">Password:</span> <br/>
                    <span className="text-slate-900 font-bold">{createdData.password}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400">PIN POS:</span> <br/>
                    <span className="text-slate-900 font-bold">{createdData.pin_code}</span>
                  </div>
                </div>
            </div>

            <button onClick={handleCopyCredentials} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all mb-3 text-sm">
                <Copy size={18} /> {copied ? '¡Copiado!' : 'Copiar Todo'}
            </button>
            <button onClick={() => { onSave(); onClose(); }} className="w-full py-4 text-slate-400 font-black hover:text-slate-900 text-[10px] uppercase tracking-widest">
                Terminar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-[900px] overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 border-b border-slate-100 px-10 py-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="text-primary" size={28} />
              {user ? 'Configurar Perfil' : 'Registro de Personal'}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Define roles y permisos específicos</p>
          </div>
          <button onClick={onClose} className="bg-white p-3 rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto overflow-x-hidden">
          <div className="p-10 space-y-12">
            {/* Sección 1: Datos Básicos */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">1</div>
                 <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Información de Identidad</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 block">Nombre Completo</label>
                    <input
                      type="text" required value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-900 transition-all"
                      placeholder="Ej: Juan Pérez"
                    />
                 </div>
                 
                 {!user && (
                   <>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 flex items-center gap-2">
                        <Mail size={12} /> Correo Electrónico
                      </label>
                      <input
                        type="email" required value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-900 transition-all"
                        placeholder="email@negocio.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 flex items-center gap-2">
                        <Lock size={12} /> Contraseña
                      </label>
                      <input
                        type="password" required value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-900 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                   </>
                 )}
              </div>
            </div>

            {/* Sección 2: Rol y PIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">2</div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Rol y Seguridad</h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 block">Cargo / Puesto</label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 cursor-pointer"
                      >
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="waiter">Mesero</option>
                        <option value="cashier">Cajero</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3 block">PIN POS (4 dígitos)</label>
                      <input
                        type="text" maxLength="4" pattern="\d{4}" required
                        value={formData.pin_code}
                        onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl tracking-[0.5em] text-center focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="0000"
                      />
                    </div>
                  </div>
               </div>

               <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs">3</div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Permisos Granulares</h3>
                  </div>
                  
                  <div className="bg-slate-50 rounded-[2rem] p-4 border border-slate-100 space-y-2">
                    {PERMISSION_LABELS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                          formData.permissions[p.id] 
                            ? `bg-white border-${p.color}-100 shadow-sm` 
                            : 'bg-transparent border-transparent grayscale opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${p.color}-50 text-${p.color}-600`}>
                            {p.icon}
                          </div>
                          <span className={`text-[11px] font-bold ${formData.permissions[p.id] ? 'text-slate-900' : 'text-slate-400'}`}>
                            {p.label}
                          </span>
                        </div>
                        <div className={`w-8 h-5 rounded-full relative transition-all ${formData.permissions[p.id] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.permissions[p.id] ? 'left-4' : 'left-1'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Estado e Interruptor */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex items-center justify-between">
              <div>
                <p className="font-black flex items-center gap-2">
                  <Check size={16} className="text-emerald-400" /> Acceso a la Plataforma
                </p>
                <p className="text-slate-400 text-xs font-medium mt-1">Activa o bloquea la entrada de este empleado</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" className="sr-only peer"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <div className="w-14 h-8 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6"></div>
              </label>
            </div>

            {/* Acción de Peligro: Eliminar */}
            {user && (
              <div className="pt-8 mt-8 border-t border-slate-100">
                <div className="bg-rose-50 rounded-[2rem] p-8 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                         <AlertTriangle size={24} />
                      </div>
                      <div>
                         <h4 className="font-black text-rose-900">Zona de Riesgo</h4>
                         <p className="text-rose-700 text-xs font-medium mt-1">Borrar permanentemente este empleado y todos sus registros de acceso.</p>
                      </div>
                   </div>
                   <button
                     type="button"
                     onClick={handleDeleteUser}
                     disabled={deleting}
                     className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 text-xs uppercase tracking-widest flex items-center gap-2 min-w-[150px] justify-center"
                   >
                     {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                     {deleting ? 'Borrando...' : 'Eliminar Usuario'}
                   </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0 mt-auto">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 text-slate-500 font-black hover:bg-white rounded-2xl transition-all uppercase tracking-widest text-[11px]">
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-black shadow-2xl shadow-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {user ? 'Guardar Cambios' : 'Finalizar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
