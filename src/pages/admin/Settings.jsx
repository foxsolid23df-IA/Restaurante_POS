import { useState, useEffect } from 'react'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import { 
  Building2, 
  Receipt, 
  Settings as SettingsIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  DollarSign, 
  Percent,
  Save,
  ShieldCheck,
  FileText,
  Printer,
  Upload,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import PrinterSettings from '../components/PrinterSettings'

export default function Settings() {
  const { settings, loading, fetchSettings, updateSettings } = useBusinessStore()
  const [formData, setFormData] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings })
    }
  }, [settings])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await updateSettings(formData)
      alert('Configuración guardada correctamente')
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (!formData && !useBusinessStore.getState().error) return (
    <div className="flex items-center justify-center min-h-[500px]">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  if (useBusinessStore.getState().error && !formData) return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2.5rem] text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-black text-red-900 mb-2">Error de Base de Datos</h3>
        <p className="text-red-700 font-medium mb-6">
          No se pudo cargar la configuración. Es probable que falte la tabla <code className="bg-red-100 px-2 py-0.5 rounded">business_settings</code>.
        </p>
        <p className="text-sm text-red-500 bg-white inline-block px-4 py-2 rounded-xl">
          Error: {useBusinessStore.getState().error}
        </p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración del Sistema</h1>
          <p className="text-slate-500 mt-2 font-medium">Impuestos, datos fiscales y personalización de tickets</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          <Save size={24} />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Sección de Datos de Empresa */}
        <div className="md:col-span-12 space-y-8">
           <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                 <Building2 className="text-blue-600" />
                 Identidad del Negocio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Nombre Comercial</label>
                    <div className="relative">
                       <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                       <input 
                         type="text" 
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">RFC / ID Fiscal (México)</label>
                    <div className="relative">
                       <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                       <input 
                         type="text" 
                         value={formData.rfc}
                         onChange={(e) => setFormData({...formData, rfc: e.target.value})}
                         className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                         placeholder="ABC123456XYZ"
                       />
                    </div>
                 </div>

                 <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Dirección Fiscal</label>
                    <div className="relative">
                       <MapPin className="absolute left-4 top-5 text-slate-400" size={20} />
                       <textarea 
                         value={formData.address}
                         onChange={(e) => setFormData({...formData, address: e.target.value})}
                         className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                         rows={2}
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Teléfono</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                       <input 
                         type="text" 
                         value={formData.phone}
                         onChange={(e) => setFormData({...formData, phone: e.target.value})}
                         className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Email de Soporte/Facturas</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                       <input 
                         type="email" 
                         value={formData.email}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                         className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Configuración de Impuestos */}
           <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <Percent size={150} />
              </div>
              
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                 <Receipt className="text-blue-400" />
                 Configuración Fiscal & Impuestos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-blue-300 uppercase tracking-widest px-2">Nombre del Impuesto</label>
                    <input 
                      type="text" 
                      value={formData.tax_name}
                      onChange={(e) => setFormData({...formData, tax_name: e.target.value})}
                      className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-blue-400 transition-all"
                    />
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-blue-300 uppercase tracking-widest px-2">Tasa de Impuesto (%)</label>
                    <div className="relative">
                       <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                       <input 
                         type="number" 
                         step="0.01"
                         value={formData.tax_rate * 100}
                         onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value) / 100})}
                         className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-blue-400 transition-all"
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-blue-300 uppercase tracking-widest px-2">Moneda Principal</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                       <select 
                         value={formData.currency}
                         onChange={(e) => setFormData({...formData, currency: e.target.value})}
                         className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-blue-400 transition-all appearance-none"
                       >
                         <option value="MXN" className="bg-slate-900">Peso Mexicano (MXN)</option>
                         <option value="USD" className="bg-slate-900">Dólar Americano (USD)</option>
                         <option value="EUR" className="bg-slate-900">Euro (EUR)</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between">
                 <div>
                    <p className="font-black text-lg">Facturación Electrónica (beta)</p>
                    <p className="text-xs text-slate-400 font-medium">Habilitar conexión con PAC externo para timbrado electrónico</p>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_electronic_invoicing_enabled: !formData.is_electronic_invoicing_enabled})}
                  className={`w-20 h-10 rounded-full relative transition-all duration-300 ${formData.is_electronic_invoicing_enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-8 h-8 rounded-full bg-white transition-all duration-300 shadow-xl ${formData.is_electronic_invoicing_enabled ? 'left-11' : 'left-1'}`} />
                 </button>
              </div>
           </div>

           {/* Personalización de Ticket */}
           <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                 <Printer className="text-slate-400" />
                 Personalización de Tickets (Impresión Térmica)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Encabezado Personalizado</label>
                       <textarea 
                         value={formData.ticket_header}
                         onChange={(e) => setFormData({...formData, ticket_header: e.target.value})}
                         placeholder="Ej: Sabor y Tradición - Lunes a Domingo 8am-10pm"
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                         rows={4}
                       />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Pie de Ticket</label>
                       <input 
                         type="text" 
                         value={formData.ticket_footer}
                         onChange={(e) => setFormData({...formData, ticket_footer: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                       />
                    </div>
                 </div>

                 {/* Preview de Ticket */}
                 <div className="bg-slate-100 p-8 rounded-[2.5rem] flex items-center justify-center">
                    <div className="w-[300px] bg-white shadow-2xl p-6 font-mono text-xs scale-90 origin-center text-slate-600 border-t-8 border-slate-900">
                       <div className="text-center mb-4">
                          <p className="font-bold text-black uppercase text-sm mb-1">{formData.name || 'Mi Restaurante'}</p>
                          <p className="whitespace-pre-line text-[10px]">{formData.ticket_header}</p>
                       </div>
                       <div className="border-y border-dashed border-slate-300 py-2 mb-4 space-y-1">
                          <p className="flex justify-between"><span>MESERO:</span> <span>JUAN P.</span></p>
                          <p className="flex justify-between"><span>FECHA:</span> <span>27/01/2026</span></p>
                          <p className="flex justify-between"><span>FOLIO:</span> <span>#000123</span></p>
                       </div>
                       <div className="space-y-1 mb-4">
                          <p className="flex justify-between font-bold text-black"><span>1 HAMBURGUESA</span> <span>$180.00</span></p>
                          <p className="flex justify-between font-bold text-black"><span>2 REFRESCO</span> <span>$70.00</span></p>
                       </div>
                       <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                          <p className="flex justify-between font-bold"><span>SUBTOTAL:</span> <span>$215.52</span></p>
                          <p className="flex justify-between font-bold"><span>{formData.tax_name} ({formData.tax_rate * 100}%):</span> <span>${(215.52 * 0.16).toFixed(2)}</span></p>
                          <p className="flex justify-between font-black text-black text-sm pt-1"><span>TOTAL:</span> <span>$250.00</span></p>
                       </div>
                       <div className="text-center mt-6">
                          <p className="font-bold uppercase mb-1">{formData.ticket_footer}</p>
                          <p className="text-[9px]">RFC: {formData.rfc}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Hardware de Impresión */}
           <PrinterSettings />
        </div>
      </div>
    </div>
  )
}
