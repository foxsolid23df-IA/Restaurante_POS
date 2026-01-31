import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, MapPin, Phone, Building2, Check, X, Shield, Users, ArrowRightLeft, Package } from 'lucide-react'
import { useBranchStore } from '@/store/branchStore'
import InventoryTransferModal from '@/components/Inventory/InventoryTransferModal'

export default function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', is_main_office: false })
  const { currentBranch, setCurrentBranch } = useBranchStore()

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    setLoading(true)
    const { data } = await supabase.from('branches').select('*').order('created_at', { ascending: true })
    setBranches(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('branches').insert([formData])
      if (error) throw error
      setShowModal(false)
      setFormData({ name: '', address: '', phone: '', is_main_office: false })
      fetchBranches()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Sucursales</h1>
          <p className="text-slate-500 font-medium mt-2">Control centralizado y transferencia de inventario multi-sucursal</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-3"
        >
          <Plus size={20} />
          Nueva Sucursal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Building2 className="text-blue-600" />} label="Sucursales Activas" value={branches.length} />
        <StatCard icon={<Users className="text-emerald-600" />} label="Staff Total" value="---" />
        <StatCard icon={<Shield className="text-purple-600" />} label="Sucursales Matriz" value={branches.filter(b => b.is_main_office).length} />
        <StatCard icon={<MapPin className="text-orange-600" />} label="Ubicaciones" value={branches.length} />
      </div>

      {/* Branches List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {branches.map(branch => (
          <div 
            key={branch.id} 
            className={`bg-white rounded-[3rem] p-10 border transition-all relative overflow-hidden group ${
              currentBranch?.id === branch.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'
            }`}
          >
            {branch.is_main_office && (
               <div className="absolute top-8 right-8 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                  Matriz
               </div>
            )}
            
            <div className="flex items-center gap-6 mb-8">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all border border-slate-100 font-black text-2xl">
                  {branch.name.charAt(0)}
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900">{branch.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                     <MapPin size={12} />
                     {branch.address || 'Sin dirección'}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-slate-50 p-6 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2 italic">
                     <Phone size={14} className="text-slate-400" />
                     {branch.phone || 'N/A'}
                  </p>
               </div>
               <div className="bg-slate-50 p-6 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                     <p className="font-bold text-slate-900">{branch.is_active ? 'Activa' : 'Inactiva'}</p>
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
               <button 
                onClick={() => setCurrentBranch(branch)}
                className={`flex-1 py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${
                  currentBranch?.id === branch.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
               >
                 {currentBranch?.id === branch.id ? <Check size={18} /> : null}
                 {currentBranch?.id === branch.id ? 'Seleccionada' : 'Entrar a Sucursal'}
               </button>
               <button className="px-6 py-5 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100">
                  Configurar
               </button>
            </div>
          </div>
        ))}

        {/* Action Card: Transfer */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-white flex flex-col justify-between shadow-2xl shadow-blue-200 relative overflow-hidden">
           <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
           <div className="relative z-10">
              <h3 className="text-3xl font-black mb-4 leading-tight">Transferencia de Inventario</h3>
              <p className="text-blue-100 font-medium text-lg leading-relaxed opacity-80">
                Mueve insumos entre sucursales de forma fácil y mantén el stock equilibrado en toda tu red.
              </p>
           </div>
           
           <button 
            onClick={() => setShowTransferModal(true)}
            className="mt-12 bg-white text-blue-600 px-8 py-5 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl hover:scale-105 transition-all w-fit relative z-10"
           >
              <ArrowRightLeft size={18} />
              Iniciar Nueva Transferencia
           </button>
        </div>
      </div>

      {/* Modals */}
      {showTransferModal && (
        <InventoryTransferModal 
          onClose={() => setShowTransferModal(false)}
          onSave={() => {
            // Refrescar datos si es necesario
            fetchBranches()
          }}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Agregar Nueva Sucursal</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Nombre Comercial</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Ej: Sucursal Norte"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Dirección</label>
                <input 
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Calle, Número, Ciudad..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Teléfono</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="55..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Tipo</label>
                  <div className="flex items-center gap-3 h-[52px]">
                    <input 
                      type="checkbox"
                      id="isMain"
                      checked={formData.is_main_office}
                      onChange={(e) => setFormData({...formData, is_main_office: e.target.checked})}
                      className="w-6 h-6 rounded-lg text-blue-600"
                    />
                    <label htmlFor="isMain" className="text-sm font-bold text-slate-900">Oficina Real/Matriz</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all uppercase"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all">
       <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-all scale-150">
          {icon}
       </div>
       <div className="flex items-center gap-4 mb-4">
         <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
           {icon}
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       </div>
       <h4 className="text-3xl font-black text-slate-900">{value}</h4>
    </div>
  )
}
