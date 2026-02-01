import { useState, useEffect } from 'react'
import { X, Save, FileText, Info, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function WelcomeEmailModal({ onClose }) {
  const [template, setTemplate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [])

  const loadTemplate = async () => {
    try {
      // Usamos limit(1) para evitar el error PGRST116 si hay registros duplicados
      const { data, error } = await supabase
        .from('staff_config')
        .select('id, welcome_template')
        .order('updated_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setTemplate(data[0].welcome_template)
      } else {
        setTemplate('¡Hola {full_name}! 👋\n\nBienvenido al equipo...')
      }
    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Error al cargar la plantilla: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Buscamos si ya existe una configuración para actualizarla o crearla
      const { data: existing } = await supabase
        .from('staff_config')
        .select('id')
        .limit(1)

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('staff_config')
          .update({ welcome_template: template, updated_at: new Date() })
          .eq('id', existing[0].id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('staff_config')
          .insert([{ welcome_template: template }])
        if (error) throw error
      }
      
      toast.success('Plantilla de bienvenida actualizada')
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Error al guardar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-50 border-b border-slate-100 px-10 py-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="text-primary" size={28} />
              Configurar Mensaje de Bienvenida
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
               Personaliza el correo electrónico que reciben los nuevos empleados
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-white p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 font-medium leading-relaxed">
              <p className="font-bold mb-1">Variables disponibles (usa llaves):</p>
              <div className="flex flex-wrap gap-x-4">
                <span><code className="bg-blue-100 px-1 rounded">{"{full_name}"}</code> Nombre</span>
                <span><code className="bg-blue-100 px-1 rounded">{"{business_name}"}</code> Negocio</span>
                <span><code className="bg-blue-100 px-1 rounded">{"{email}"}</code> Email</span>
                <span><code className="bg-blue-100 px-1 rounded">{"{password}"}</code> Contraseña</span>
                <span><code className="bg-blue-100 px-1 rounded">{"{pin_code}"}</code> PIN</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 mb-3">Cuerpo del Mensaje</label>
            {loading ? (
              <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : (
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full h-80 px-6 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-slate-900 text-sm leading-comfortable resize-none transition-all"
                placeholder="Escribe el mensaje aquí..."
              />
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-5 text-slate-600 font-black hover:bg-slate-50 rounded-2xl transition-all text-sm uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-black shadow-2xl shadow-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
