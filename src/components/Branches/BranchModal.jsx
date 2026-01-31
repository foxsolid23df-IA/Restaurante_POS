import { X, Save, Building2, MapPin, Phone, ShieldCheck, Loader2 } from 'lucide-react'

export default function BranchModal({ isOpen, onClose, onSave, formData, setFormData, loading }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] p-12 shadow-2xl w-full max-w-2xl border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Building2 size={180} />
        </div>

        <div className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Nueva Entidad</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 border-l-4 border-primary pl-4 ml-1">Registro de Expansión Corporativa</p>
          </div>
          <button 
            onClick={onClose}
            className="p-5 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all shadow-inner"
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-10 relative z-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                 <Building2 size={12}/> Identidad Comercial
              </label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-6 text-xl font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-200"
                placeholder="Nombre de la Sucursal..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                 <MapPin size={12}/> Geolocalización / Domicilio
              </label>
              <input 
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-6 text-lg font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-200"
                placeholder="Calle, Número, Ciudad y Código Postal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                   <Phone size={12}/> Contacto Técnico
                </label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-slate-900 focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-slate-200"
                  placeholder="Sin número reg."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 flex items-center gap-2">
                   <ShieldCheck size={12}/> Rango de Operación
                </label>
                <div 
                  onClick={() => setFormData({...formData, is_main_office: !formData.is_main_office})}
                  className={`h-[68px] cursor-pointer rounded-[2rem] border-2 flex items-center px-8 transition-all gap-4 group ${
                    formData.is_main_office 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    formData.is_main_office ? 'bg-primary border-primary scale-110' : 'bg-white border-slate-200'
                  }`}>
                    {formData.is_main_office && <Save size={12} className="text-white" />}
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">Definir como Matriz</span>
                </div>
              </div>
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
                  Consolidar Sucursal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
