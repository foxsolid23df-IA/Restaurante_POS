import { Receipt, Percent, DollarSign, Sparkles } from 'lucide-react'

export default function FiscalSettings({ formData, setFormData }) {
  return (
    <section className="bg-slate-900 rounded-[4rem] p-12 shadow-2xl text-white overflow-hidden relative border-4 border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12">
        <Percent size={250} />
      </div>
      
      <div className="flex justify-between items-start mb-12 relative z-10">
        <h3 className="text-3xl font-black flex items-center gap-4 tracking-tighter">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
            <Receipt size={28} />
          </div>
          Configuración Fiscal
        </h3>
        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full flex items-center gap-2">
           <Sparkles size={14} className="text-primary" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Motor de Cálculo ACTIVO</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4">Etiqueta de Impuesto</label>
          <input 
            type="text" 
            value={formData.tax_name || ''}
            onChange={(e) => setFormData({...formData, tax_name: e.target.value})}
            className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xl"
            placeholder="Ej: IVA"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4">Tasa Impositiva (%)</label>
          <div className="relative">
            <Percent className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/50" size={20} />
            <input 
              type="number" 
              step="0.01"
              value={formData.tax_rate ? (formData.tax_rate * 100).toFixed(2) : '0'}
              onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value) / 100})}
              className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xl"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4">Divisa de Operación</label>
          <div className="relative">
            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/50" size={20} />
            <select 
              value={formData.currency || 'MXN'}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
              className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xl appearance-none cursor-pointer"
            >
              <option value="MXN" className="bg-slate-900">Pesos (MXN)</option>
              <option value="USD" className="bg-slate-900">Dólares (USD)</option>
              <option value="EUR" className="bg-slate-900">Euros (EUR)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 group hover:border-primary/30 transition-all duration-500">
        <div>
          <p className="font-black text-xl tracking-tight uppercase">Facturación Electrónica Digital</p>
          <p className="text-sm text-slate-400 font-medium mt-1">Sincronización automática con PAC para timbrado de CFDI v4.0 (México)</p>
        </div>
        <button 
          type="button"
          onClick={() => setFormData({...formData, is_electronic_invoicing_enabled: !formData.is_electronic_invoicing_enabled})}
          className={`w-24 h-12 rounded-full relative transition-all duration-500 shadow-2xl ${formData.is_electronic_invoicing_enabled ? 'bg-primary shadow-emerald-500/20' : 'bg-slate-800'}`}
        >
          <div className={`absolute top-1.5 w-9 h-9 rounded-full bg-white transition-all duration-500 shadow-xl flex items-center justify-center ${formData.is_electronic_invoicing_enabled ? 'left-13.5' : 'left-1.5'}`}>
             <div className={`w-2 h-2 rounded-full ${formData.is_electronic_invoicing_enabled ? 'bg-primary animate-pulse' : 'bg-slate-200'}`} />
          </div>
        </button>
      </div>
    </section>
  )
}
