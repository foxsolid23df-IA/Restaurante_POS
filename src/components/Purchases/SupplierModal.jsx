import { X, Save, Truck, Package, Phone, Mail, User, Hash, Loader2 } from 'lucide-react'

export default function SupplierModal({ editing, formData, setFormData, onSave, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Truck size={150} />
        </div>
        
        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
               {editing ? 'Ficha de Proveedor' : 'Nuevo Aliado Comercial'}
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest">Sucursal Matriz / Central</p>
          </div>
          <button 
            onClick={onClose}
            className="bg-slate-50 p-4 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ModalInput 
              label="Nombre de Empresa" 
              icon={<Truck size={16}/>} 
              value={formData.name} 
              onChange={v => setFormData({...formData, name: v})} 
              placeholder="Ej: Suministros Pro S.A."
              required
            />
            <ModalInput 
              label="Giro / Categoría" 
              icon={<Package size={16}/>} 
              value={formData.category} 
              onChange={v => setFormData({...formData, category: v})} 
              type="select" 
              options={['Food', 'Beverage', 'Maintenance', 'Technology', 'Other']} 
            />
            <ModalInput 
              label="Contacto Directo" 
              icon={<User size={16}/>} 
              value={formData.contact_name} 
              onChange={v => setFormData({...formData, contact_name: v})} 
              placeholder="Nombre del Ejecutivo"
              required
            />
            <ModalInput 
              label="RFC / Tax ID" 
              icon={<Hash size={16}/>} 
              value={formData.tax_id} 
              onChange={v => setFormData({...formData, tax_id: v})} 
              placeholder="Estructura Fiscal"
            />
            <ModalInput 
              label="Teléfono Móvil" 
              icon={<Phone size={16}/>} 
              value={formData.phone} 
              onChange={v => setFormData({...formData, phone: v})} 
              placeholder="+52 000 000 0000"
            />
            <ModalInput 
              label="Correo Electrónico" 
              icon={<Mail size={16}/>} 
              value={formData.email} 
              onChange={v => setFormData({...formData, email: v})} 
              placeholder="ordenes@proveedor.com"
              type="email"
            />
          </div>

          <div className="pt-8 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 py-5 text-slate-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] bg-slate-900 py-5 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-300 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={18} />}
              {loading ? 'Sincronizando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalInput({ label, value, onChange, type = 'text', options = [], icon, placeholder, required = false }) {
  return (
    <div className="flex flex-col gap-3">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 flex items-center gap-2">
          {icon}
          {label}
       </label>
       <div className="relative">
         {type === 'select' ? (
           <select 
             value={value}
             onChange={e => onChange(e.target.value)}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
           >
             {options.map(o => <option key={o} value={o}>{o}</option>)}
           </select>
         ) : (
           <input 
             type={type}
             value={value}
             required={required}
             onChange={e => onChange(e.target.value)}
             placeholder={placeholder}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
           />
         )}
       </div>
    </div>
  )
}
