import { useState, useEffect } from 'react'
import { X, Save, Truck, Package, Phone, Mail, User, Hash, Loader2, Settings2, Plus, Trash2 } from 'lucide-react'
import { usePurchases } from '@/hooks/usePurchases'
import { toast } from 'sonner'

export default function SupplierModal({ editing, formData, setFormData, onSave, onClose, loading: saveLoading }) {
  const { getSupplierCategories, addSupplierCategory, deleteSupplierCategory } = usePurchases()
  const [categories, setCategories] = useState([])
  const [showCatManager, setShowCatManager] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isManaging, setIsManaging] = useState(false)

  const loadCategories = async () => {
    const data = await getSupplierCategories()
    setCategories(data || [])
    if (data?.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: data[0].name }))
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      setIsManaging(true)
      await addSupplierCategory(newCatName.trim())
      setNewCatName('')
      await loadCategories()
      toast.success('Categoría agregada')
    } catch (err) {
      toast.error('Error al agregar categoría')
    } finally {
      setIsManaging(false)
    }
  }

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`¿Eliminar categoría "${name}"?`)) return
    try {
      setIsManaging(true)
      await deleteSupplierCategory(id)
      await loadCategories()
      toast.success('Categoría eliminada')
    } catch (err) {
      toast.error('Error al eliminar categoría')
    } finally {
      setIsManaging(false)
    }
  }

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

        {showCatManager ? (
          <div className="space-y-6 relative z-10 animate-in slide-in-from-right-5 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Gestionar Categorías</h4>
              <button onClick={() => setShowCatManager(false)} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Volver al Formulario</button>
            </div>
            
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Nueva categoría..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 outline-none"
              />
              <button 
                onClick={handleAddCategory}
                disabled={isManaging}
                className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 group hover:border-blue-100 transition-all shadow-sm">
                  <span className="font-black text-slate-700 uppercase text-xs tracking-tight">{cat.name}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
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
              <div className="flex flex-col gap-3">
                 <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Package size={16}/> Giro / Categoría</span>
                    <button type="button" onClick={() => setShowCatManager(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-900" title="Configurar Categorías">
                      <Settings2 size={14} />
                    </button>
                 </label>
                 <div className="relative">
                   <select 
                     value={formData.category}
                     onChange={e => setFormData({...formData, category: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                   >
                     {categories.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                     {categories.length === 0 && <option value="">Sin categorías</option>}
                   </select>
                 </div>
              </div>
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
              disabled={saveLoading}
              className="flex-[2] bg-slate-900 py-5 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-300 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saveLoading ? <Loader2 className="animate-spin" size={20}/> : <Save size={18} />}
              {saveLoading ? 'Sincronizando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
)
}

function ModalInput({ label, value, onChange, type = 'text', options = [], icon, placeholder, required = false }) {
  return (
    <div className="flex flex-col gap-3">
       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-3 flex items-center gap-2">
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
