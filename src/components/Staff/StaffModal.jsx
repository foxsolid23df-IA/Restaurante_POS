import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Copy, Globe, KeyRound, Loader2, Mail, Save, Shield, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  DEFAULT_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  staffApi
} from '@/features/staff/api/staffApi'

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function StaffModal({ user, branches = [], onClose, onSave }) {
  const inputClass = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900'
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'waiter',
    pin_code: '',
    branch_id: '',
    is_active: true,
    preferred_language: 'es',
    permissions: { ...DEFAULT_PERMISSIONS }
  })
  const [loading, setLoading] = useState(false)
  const [createdData, setCreatedData] = useState(null)
  const [copied, setCopied] = useState(false)
  const isEditing = Boolean(user)

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'waiter',
        pin_code: '',
        branch_id: user.branch_id || '',
        is_active: user.is_active ?? true,
        preferred_language: user.preferred_language || 'es',
        permissions: staffApi.normalizePermissions(user.role, user.permissions)
      })
    } else {
      const role = 'waiter'
      setFormData({
        full_name: '',
        email: '',
        password: generatePassword(),
        role,
        pin_code: generatePin(),
        branch_id: branches[0]?.id || '',
        is_active: true,
        permissions: { ...(ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS) },
        preferred_language: 'es',
      })
    }
  }, [user, branches])

  const enabledPermissions = useMemo(
    () => PERMISSION_LABELS.filter((permission) => formData.permissions?.[permission.id]),
    [formData.permissions]
  )

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      permissions: { ...(ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS) }
    }))
  }

  const togglePermission = (permissionId) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: !prev.permissions?.[permissionId]
      }
    }))
  }

  const handleCopyCredentials = async () => {
    if (!createdData) return
    const text = [
      `Credenciales de acceso - ${createdData.full_name}`,
      '',
      `Correo: ${createdData.email}`,
      `Password temporal: ${createdData.password}`,
      `PIN POS: ${createdData.pin_code}`,
      '',
      'El PIN es solo para POS. El portal administrador requiere correo y password.'
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credenciales copiadas')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        branch_id: formData.branch_id || null,
        pin_code: formData.pin_code || undefined
      }

      if (!payload.full_name) throw new Error('El nombre es requerido')
      if (!isEditing && !payload.email) throw new Error('El correo es requerido')
      if (!isEditing && !payload.password) throw new Error('El password temporal es requerido')
      if (!isEditing && !payload.pin_code) throw new Error('El PIN es requerido')
      if (payload.pin_code && !/^\d{4}$/.test(payload.pin_code)) throw new Error('El PIN debe tener 4 digitos')

      if (isEditing) {
        await staffApi.updateStaff(user.id, payload)
        toast.success('Empleado actualizado')
        onSave()
      } else {
        await staffApi.createStaff(payload)
        setCreatedData(payload)
        toast.success('Empleado creado')
      }
    } catch (error) {
      console.error('Error saving staff:', error)
      toast.error(error.message || 'Error al guardar empleado')
    } finally {
      setLoading(false)
    }
  }

  if (createdData) {
    return (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
          <div className="p-7 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Check size={34} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Empleado registrado</h2>
            <p className="text-slate-500 font-medium mb-6 text-sm">Copia estos datos ahora. El PIN no se mostrara de nuevo.</p>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-left mb-6 font-mono text-sm">
              <Credential label="Correo" value={createdData.email} />
              <Credential label="Password" value={createdData.password} />
              <Credential label="PIN POS" value={createdData.pin_code} />
            </div>

            <button onClick={handleCopyCredentials} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all mb-2 text-sm">
              <Copy size={18} /> {copied ? 'Copiado' : 'Copiar credenciales'}
            </button>
            <button onClick={onSave} className="w-full py-3 text-slate-500 font-black hover:text-slate-900 text-xs uppercase tracking-widest">
              Terminar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="text-primary" size={24} />
              {isEditing ? 'Editar empleado' : 'Nuevo empleado'}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Roles, permisos, sucursal y PIN POS.</p>
          </div>
          <button onClick={onClose} className="bg-white p-2 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm border border-slate-100 transition-all" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre completo">
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                  className={inputClass}
                  placeholder="Ej: Juan Perez"
                />
              </Field>

              <Field label="Correo electronico" icon={<Mail size={13} />}>
                <input
                  type="email"
                  required={!isEditing}
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className={inputClass}
                  placeholder="email@restaurante.com"
                />
              </Field>

              {!isEditing && (
                <Field label="Password temporal">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setFormData({ ...formData, password: generatePassword() })} className="px-3 rounded-xl bg-slate-100 font-black text-xs">
                      Generar
                    </button>
                  </div>
                </Field>
              )}

              <Field label={isEditing ? 'Nuevo PIN POS (opcional)' : 'PIN POS'}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength="4"
                    required={!isEditing}
                    value={formData.pin_code}
                    onChange={(event) => setFormData({ ...formData, pin_code: event.target.value.replace(/\D/g, '') })}
                    className={`${inputClass} text-center font-black tracking-[0.45em]`}
                    placeholder={isEditing ? '----' : '0000'}
                  />
                  <button type="button" onClick={() => setFormData({ ...formData, pin_code: generatePin() })} className="px-3 rounded-xl bg-slate-100 font-black text-xs flex items-center gap-2">
                    <KeyRound size={14} />
                    Generar
                  </button>
                </div>
                {isEditing && <p className="text-xs text-slate-500 mt-2">Dejalo vacio para conservar el PIN actual.</p>}
              </Field>

              <Field label="Rol">
                <select value={formData.role} onChange={(event) => handleRoleChange(event.target.value)} className={inputClass}>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Sucursal">
                <select value={formData.branch_id} onChange={(event) => setFormData({ ...formData, branch_id: event.target.value })} className={inputClass}>
                  <option value="">Sin sucursal fija</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Idioma preferido" icon={<Globe size={13} />}>
                <select value={formData.preferred_language} onChange={(event) => setFormData({ ...formData, preferred_language: event.target.value })} className={inputClass}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </Field>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-black text-slate-900">Permisos granulares</h3>
                  <p className="text-xs text-slate-500 font-semibold">{enabledPermissions.length} permisos activos</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={formData.is_active}
                    onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                  />
                  Activo
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PERMISSION_LABELS.map((permission) => (
                  <button
                    key={permission.id}
                    type="button"
                    onClick={() => togglePermission(permission.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                      formData.permissions?.[permission.id]
                        ? 'bg-white border-emerald-200 text-slate-900 shadow-sm'
                        : 'bg-transparent border-transparent text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-black">{permission.label}</span>
                    <span className={`h-5 w-9 rounded-full relative ${formData.permissions?.[permission.id] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${formData.permissions?.[permission.id] ? 'left-5' : 'left-1'}`} />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {formData.permissions?.access_admin && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">Este empleado podra entrar al portal administrador solo con sesion real por correo y password.</p>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 text-slate-600 font-black hover:bg-white rounded-xl transition-all text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-900 text-white px-5 py-3 rounded-xl font-black hover:bg-black shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isEditing ? 'Guardar cambios' : 'Crear empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}

function Credential({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-black text-slate-900 break-all">{value}</p>
    </div>
  )
}
