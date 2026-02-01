import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Users, MapPin, Save, Loader2, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ReservationModal({ onClose, onSubmit, loading, customers }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    table_id: '',
    reservation_date: '',
    reservation_time: '',
    pax: 2,
    notes: ''
  })
  
  const [tables, setTables] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    const { data } = await supabase.from('tables').select('id, name').order('name')
    setTables(data || [])
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.customer_id || !formData.reservation_date || !formData.reservation_time) return
    
    const fullDateTime = `${formData.reservation_date}T${formData.reservation_time}:00`
    onSubmit({
      customer_id: formData.customer_id,
      table_id: formData.table_id || null,
      reservation_date: new Date(fullDateTime).toISOString(),
      pax: formData.pax,
      notes: formData.notes,
      status: 'pending'
    })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl border border-white/20 relative overflow-hidden">
        
        <div className="p-10 border-b border-slate-50 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Agendar Reservación</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 border-l-4 border-primary pl-4">
              Sistema de Gestión de Mesas v2.0
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all shadow-inner"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Selección de Cliente */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Seleccionar Cliente</label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
              <input 
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-inner"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto p-2">
               {filteredCustomers.map(c => (
                 <button
                   key={c.id}
                   type="button"
                   onClick={() => { setFormData({...formData, customer_id: c.id}); setSearchTerm(c.name); }}
                   className={`p-4 rounded-2xl border text-left transition-all ${
                     formData.customer_id === c.id 
                       ? 'bg-primary border-primary text-white shadow-lg shadow-emerald-200' 
                       : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                   }`}
                 >
                   <p className="font-black text-xs uppercase leading-tight">{c.name}</p>
                   <p className="text-[10px] opacity-70 font-medium">{c.phone || 'Sin tel.'}</p>
                 </button>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input 
                  type="date"
                  required
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all h-20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Hora</label>
              <div className="relative">
                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input 
                  type="time"
                  required
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all h-20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Número de Personas</label>
              <div className="relative">
                <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input 
                  type="number"
                  min="1"
                  value={formData.pax}
                  onChange={(e) => setFormData({...formData, pax: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all h-20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Mesa (Opcional)</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <select 
                  value={formData.table_id}
                  onChange={(e) => setFormData({...formData, table_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all h-20 appearance-none"
                >
                  <option value="">Asignar al llegar</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Notas Especiales</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Ej. Aniversario, Alergias, Mesa cerca de la ventana..."
              className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-6 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all h-32 resize-none"
            />
          </div>

          <div className="pt-8">
            <button 
              type="submit"
              disabled={loading || !formData.customer_id}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>
                  <Save size={20} />
                  Confirmar Reservación
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
