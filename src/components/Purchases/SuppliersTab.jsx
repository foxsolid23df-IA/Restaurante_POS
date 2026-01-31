import { useState } from 'react'
import { Plus, Truck, Phone, Mail, User, ShieldCheck, Edit3 } from 'lucide-react'
import { usePurchases } from '@/hooks/usePurchases'
import { toast } from 'sonner'
import SupplierModal from './SupplierModal'

export default function SuppliersTab({ suppliers, onUpdate }) {
  const { saveSupplier, loading } = usePurchases()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    category: 'Food',
    tax_id: ''
  })

  const openNew = () => {
    setEditing(null)
    setFormData({ name: '', contact_name: '', phone: '', email: '', category: 'Food', tax_id: '' })
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setFormData({
      name: s.name,
      contact_name: s.contact_name,
      phone: s.phone || '',
      email: s.email || '',
      category: s.category || 'Food',
      tax_id: s.tax_id || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await saveSupplier(editing ? { ...formData, id: editing.id } : formData)
      toast.success(editing ? "Proveedor actualizado" : "Proveedor registrado con éxito")
      setShowModal(false)
      onUpdate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
         <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Directorio de Proveedores</h3>
             <p className="text-slate-400 font-medium text-xs uppercase tracking-widest mt-1">Gestión de contactos y alianzas estratégicas</p>
         </div>
         <button 
           onClick={openNew}
           className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl shadow-slate-300 hover:bg-black transition-all hover:scale-[1.05] active:scale-95 text-xs uppercase tracking-[0.2em]"
         >
           <Plus size={20} />
           Nuevo Proveedor
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {suppliers.map(s => (
           <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all relative group overflow-hidden duration-500">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-all pointer-events-none transform group-hover:rotate-12">
                <Truck size={120} />
              </div>
              
              <div className="flex items-center gap-5 mb-8">
                 <div className="w-16 h-16 bg-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white rounded-2xl flex items-center justify-center font-black text-3xl transition-all shadow-inner group-hover:shadow-xl group-hover:rotate-3">
                    {s.name[0].toUpperCase()}
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">{s.name}</h4>
                    <span className="inline-block text-[10px] font-black uppercase text-primary bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 mt-1 tracking-widest">{s.category}</span>
                 </div>
              </div>

              <div className="space-y-5 px-2">
                 <InfoRow icon={<User size={14}/>} label="Responsable" value={s.contact_name} />
                 <InfoRow icon={<ShieldCheck size={14}/>} label="ID Fiscal / RFC" value={s.tax_id} />
                 
                 <div className="pt-8 flex gap-3">
                    <button 
                      onClick={() => openEdit(s)}
                      className="flex-1 bg-slate-50 py-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-primary hover:text-white transition-all border border-slate-100 flex items-center justify-center gap-2"
                    >
                       <Edit3 size={14}/> Editar
                    </button>
                    <div className="flex gap-2">
                      <a href={`tel:${s.phone}`} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all border border-slate-100 shadow-sm" title="Llamar">
                        <Phone size={18}/>
                      </a>
                      <a href={`mailto:${s.email}`} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all border border-slate-100 shadow-sm" title="Enviar Email">
                        <Mail size={18}/>
                      </a>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {showModal && (
        <SupplierModal 
          editing={editing}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
       <div className="mt-1 text-slate-300 group-hover:text-primary/40 transition-colors">{icon}</div>
       <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 opacity-60">{label}</p>
          <p className="font-black text-slate-900 truncate tracking-tight text-sm uppercase">{value || 'No Registrado'}</p>
       </div>
    </div>
  )
}
