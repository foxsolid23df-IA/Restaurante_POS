import { useState, useEffect } from 'react'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'

// Components
import SettingsHeader from '@/components/Settings/SettingsHeader'
import IdentitySettings from '@/components/Settings/IdentitySettings'
import FiscalSettings from '@/components/Settings/FiscalSettings'
import TicketSettings from '@/components/Settings/TicketSettings'
import PrinterSettings from '@/components/Settings/PrinterSettings'

export default function Settings() {
  const { settings, loading, fetchSettings, updateSettings } = useBusinessStore()
  const [formData, setFormData] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings })
    }
  }, [settings])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    try {
      setActionLoading(true)
      await updateSettings(formData)
      toast.success('Configuración global actualizada correctamente', {
         description: 'Los cambios se aplicarán en todos los puntos de venta de forma inmediata.'
      })
    } catch (err) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!formData && !useBusinessStore.getState().error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <Loader2 className="animate-spin text-primary mb-4" size={48} />
      <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Cargando Ecosistema...</p>
    </div>
  )

  if (useBusinessStore.getState().error && !formData) return (
    <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-screen">
      <div className="bg-white border border-slate-100 p-12 rounded-[4rem] text-center shadow-2xl shadow-rose-100 max-w-xl">
        <div className="bg-rose-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-rose-100">
          <AlertCircle className="text-rose-500" size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Error de Núcleo</h3>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          No se ha detectado la tabla maestra de configuración en la base de datos central. Contacta a soporte técnico.
        </p>
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Traza Técnica</p>
           <p className="text-xs font-mono text-rose-500 break-all">{useBusinessStore.getState().error}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] mx-auto bg-slate-50 min-h-screen space-y-12">
      <SettingsHeader onSave={handleSave} loading={actionLoading} />

      <div className="grid grid-cols-1 gap-12">
        <IdentitySettings formData={formData} setFormData={setFormData} />
        
        <FiscalSettings formData={formData} setFormData={setFormData} />
        
        <TicketSettings formData={formData} setFormData={setFormData} />
        
        <div className="pt-4">
           <PrinterSettings />
        </div>
      </div>
    </div>
  )
}
