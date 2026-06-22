import { useEffect, useState } from 'react'
import { FileText, Info, Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { staffApi } from '@/features/staff/api/staffApi'

const DEFAULT_TEMPLATE = `Hola {full_name},

Bienvenido al equipo de {business_name}.

Correo: {email}
PIN POS: {pin_code}

El PIN es solo para punto de venta. El portal administrador requiere correo y password.`

export default function WelcomeEmailModal({ onClose }) {
  const [template, setTemplate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const data = await staffApi.getWelcomeTemplate()
      setTemplate(data?.welcome_template || DEFAULT_TEMPLATE)
    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Error al cargar plantilla de bienvenida')
      setTemplate(DEFAULT_TEMPLATE)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await staffApi.saveWelcomeTemplate(template)
      toast.success('Plantilla actualizada')
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(error.message || 'Error al guardar plantilla')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="text-primary" size={24} />
              Mensaje de bienvenida
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Plantilla para entregar credenciales al nuevo empleado.
            </p>
          </div>
          <button onClick={onClose} className="bg-white p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all shadow-sm" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info size={19} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 font-medium leading-relaxed">
              <p className="font-black mb-1">Variables disponibles:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <code>{'{full_name}'}</code>
                <code>{'{business_name}'}</code>
                <code>{'{email}'}</code>
                <code>{'{password}'}</code>
                <code>{'{pin_code}'}</code>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <textarea
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              className="w-full h-80 px-5 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 text-sm leading-relaxed resize-none transition-all"
              placeholder="Escribe el mensaje aqui..."
            />
          )}

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 text-slate-600 font-black hover:bg-slate-50 rounded-xl transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-[2] bg-slate-900 text-white px-5 py-3 rounded-xl font-black hover:bg-black shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Guardando...' : 'Guardar plantilla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
