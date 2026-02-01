import { useState, useEffect } from 'react'
import { X, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

const DAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' },
]

export default function MenuModal({ menu, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    active_days: [1, 2, 3, 4, 5, 6, 0],
    is_active: true
  })

  useEffect(() => {
    if (menu) {
      setFormData({
        name: menu.name || '',
        start_time: menu.start_time || '',
        end_time: menu.end_time || '',
        active_days: menu.active_days || [1, 2, 3, 4, 5, 6, 0],
        is_active: menu.is_active ?? true
      })
    }
  }, [menu])

  const toggleDay = (dayId) => {
    setFormData(prev => ({
      ...prev,
      active_days: prev.active_days.includes(dayId)
        ? prev.active_days.filter(id => id !== dayId)
        : [...prev.active_days, dayId]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-none">Configurar Menú</h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Horarios y Disponibilidad</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Nombre */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Nombre del Menú (Ej: Desayunos)</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none focus:border-primary transition-all"
              placeholder="Ej: Menú de Desayunos"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
             {/* Hora Inicio */}
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Hora de Inicio</label>
                <div className="relative">
                   <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input
                     type="time"
                     value={formData.start_time}
                     onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold text-slate-900 outline-none focus:border-primary transition-all"
                   />
                </div>
             </div>
             {/* Hora Fin */}
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Hora de Fin</label>
                <div className="relative">
                   <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input
                     type="time"
                     value={formData.end_time}
                     onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-4 font-bold text-slate-900 outline-none focus:border-primary transition-all"
                   />
                </div>
             </div>
          </div>

          {/* Días */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Días de Disponibilidad</label>
            <div className="flex justify-between gap-2">
               {DAYS.map(day => (
                 <button
                   key={day.id}
                   type="button"
                   onClick={() => toggleDay(day.id)}
                   className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                     formData.active_days.includes(day.id)
                       ? 'bg-primary text-white shadow-lg shadow-emerald-500/20 scale-110'
                       : 'bg-slate-50 text-slate-400 grayscale'
                   }`}
                 >
                   {day.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Estado */}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all ${
               formData.is_active 
               ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
               : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'
            }`}
          >
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                   {formData.is_active ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div className="text-left">
                   <p className="font-black text-xs uppercase tracking-widest">Estado del Menú</p>
                   <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">
                      {formData.is_active ? 'Este menú está activado dentro de los horarios' : 'Menú desactivado manualmente'}
                   </p>
                </div>
             </div>
             <div className={`w-12 h-6 rounded-full relative transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'right-1' : 'left-1'}`} />
             </div>
          </button>

          {/* Footer */}
          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : menu ? 'Actualizar Menú' : 'Crear Nuevo Menú'}
          </button>
        </form>
      </div>
    </div>
  )
}
