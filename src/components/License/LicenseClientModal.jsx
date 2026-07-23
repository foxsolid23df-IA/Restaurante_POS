import { useState } from 'react'
import { Check, Copy, Loader2, Mail, Save, Shield, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { licenseApi } from '@/features/admin/api/licenseApi'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$'
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function LicenseClientModal({ onClose, onSave }) {
  const inputClass = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900'
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: generatePassword()
  })
  const [loading, setLoading] = useState(false)
  const [createdData, setCreatedData] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCopyCredentials = async () => {
    if (!createdData) return
    const text = [
      `Credenciales de Licencia - ${createdData.full_name}`,
      '',
      `Correo: ${createdData.email}`,
      `Password: ${createdData.password}`,
      '',
      'Use estos datos para activar el software Restaurante POS en el equipo del cliente.'
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
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password
      }

      if (!payload.full_name) throw new Error('El nombre es requerido')
      if (!payload.email) throw new Error('El correo es requerido')
      if (!payload.password) throw new Error('La contraseña es requerida')

      await licenseApi.createLicense(payload)
      setCreatedData(payload)
      toast.success('Cliente creado exitosamente')
    } catch (error) {
      console.error('Error creating license:', error)
      toast.error(error.message || 'Error al crear cliente')
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
            <h2 className="text-2xl font-black text-slate-900 mb-2">Cliente registrado</h2>
            <p className="text-slate-500 font-medium mb-6 text-sm">Copia estos datos y compartelos con el cliente para que active su licencia en el equipo.</p>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-left mb-6 font-mono text-sm">
              <div>
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="font-black text-slate-900">{createdData.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Correo</p>
                <p className="font-black text-slate-900 break-all">{createdData.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Password</p>
                <p className="font-black text-slate-900">{createdData.password}</p>
              </div>
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="text-primary" size={24} />
              Nuevo cliente (licencia)
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Crea una cuenta para que el cliente active el software.</p>
          </div>
          <button onClick={onClose} className="bg-white p-2 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm border border-slate-100 transition-all" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <label className="block">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <User size={13} />
                Nombre del negocio
              </span>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                className={inputClass}
                placeholder="Ej: Restaurante El Sol"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail size={13} />
                Correo electronico
              </span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className={inputClass}
                placeholder="admin@restauranteelsol.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                Contraseña
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  className={inputClass}
                />
                <button type="button" onClick={() => setFormData({ ...formData, password: generatePassword() })} className="px-3 rounded-xl bg-slate-100 font-black text-xs whitespace-nowrap">
                  Generar
                </button>
              </div>
            </label>

            <p className="text-xs text-slate-400 text-center">
              El cliente usara estos datos en la ventana de activacion del software. La licencia se vinculara automaticamente al equipo donde se active.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 text-slate-600 font-black hover:bg-white rounded-xl transition-all text-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-900 text-white px-5 py-3 rounded-xl font-black hover:bg-black shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Crear cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
