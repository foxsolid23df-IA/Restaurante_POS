import { Building2, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react'

export default function IdentitySettings({ formData, setFormData }) {
  return (
    <section className="bg-white rounded-[3.5rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in duration-500">
      <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <Building2 size={24} />
        </div>
        Identidad del Negocio
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Nombre Comercial</label>
          <div className="relative">
            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-lg"
              placeholder="Nombre del Restaurante"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Registro Fiscal (RFC)</label>
          <div className="relative">
            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              value={formData.rfc || ''}
              onChange={(e) => setFormData({...formData, rfc: e.target.value})}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-lg"
              placeholder="ABC123456XYZ"
            />
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Domicilio Fiscal Completo</label>
          <div className="relative">
            <MapPin className="absolute left-6 top-6 text-slate-300" size={20} />
            <textarea 
              value={formData.address || ''}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-lg resize-none min-h-[120px]"
              placeholder="Calle, Número, Colonia, CP, Ciudad..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Línea Telefónica Principal</label>
          <div className="relative">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              value={formData.phone || ''}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-lg"
              placeholder="+52 00 0000 0000"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Correo Institucional</label>
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="email" 
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all text-lg"
              placeholder="contacto@restaurante.com"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
