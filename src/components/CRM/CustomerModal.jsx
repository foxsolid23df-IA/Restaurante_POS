import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, Save, ShieldCheck, Heart, Loader2 } from 'lucide-react'

export default function CustomerModal({ customer, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    loyalty_points: 0
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        loyalty_points: customer.loyalty_points || 0
      })
    }
  }, [customer])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (customer) {
      onSubmit(customer.id, formData)
    } else {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] p-12 shadow-2xl w-full max-w-2xl border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <User size={180} />
        </div>

        <div className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
               {customer ? 'Expediente de Cliente' : 'Nuevo Registro'}
            </h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 border-l-4 border-primary pl-4 ml-1">Sistema de Lealtad & CRM v4.0</p>
          </div>
          <button 
            onClick={onClose}
            className="p-5 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all shadow-inner"
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                 <User size={12}/> Identidad del Cliente
              </label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-6 text-xl font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-200"
                placeholder="Nombre Completo..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                   <Phone size={12}/> Teléfono de Contacto
                </label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                  placeholder="Ej. 55..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                   <Heart size={12} className="text-rose-400" /> Puntos Iniciales
                </label>
                <input 
                  type="number"
                  value={formData.loyalty_points}
                  onChange={(e) => setFormData({...formData, loyalty_points: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                 <Mail size={12}/> Correo Electrónico
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-6 text-lg font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-200"
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-10 border-t border-slate-50">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-7 bg-slate-50 text-slate-500 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-slate-100 transition-all border border-slate-100"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-7 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] hover:bg-black transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4 disabled:opacity-50 group"
            >
              {loading ? (
                 <Loader2 className="animate-spin" size={20}/>
              ) : (
                <>
                  <Save size={20} className="group-hover:rotate-12 transition-transform" />
                  Confirmar Socio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
