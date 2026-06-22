import { useEffect, useState } from 'react'
import { X, Clock, CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react'
import { DEFAULT_ACTIVE_DAYS, normalizeActiveDays } from '@/features/catalog/api/catalogApi'
import { toast } from 'sonner'

const DAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' }
]

export default function MenuModal({ menu, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    active_days: DEFAULT_ACTIVE_DAYS,
    is_active: true
  })

  useEffect(() => {
    if (menu) {
      setFormData({
        name: menu.name || '',
        start_time: menu.start_time?.slice(0, 5) || '',
        end_time: menu.end_time?.slice(0, 5) || '',
        active_days: normalizeActiveDays(menu.active_days),
        is_active: menu.is_active ?? true
      })
    }
  }, [menu])

  const toggleDay = (dayId) => {
    setFormData((prev) => ({
      ...prev,
      active_days: prev.active_days.includes(dayId)
        ? prev.active_days.filter((id) => id !== dayId)
        : [...prev.active_days, dayId]
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.name.trim()) return toast.error('El nombre del menu es requerido')
    if (formData.active_days.length === 0) return toast.error('Selecciona al menos un dia')
    if ((formData.start_time && !formData.end_time) || (!formData.start_time && formData.end_time)) {
      return toast.error('Captura hora de inicio y fin')
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none">Configurar menu</h2>
              <p className="text-slate-500 text-xs font-bold mt-1">Horarios y disponibilidad en POS</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all" aria-label="Cerrar">
            <X size={22} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Nombre del menu
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Ej: Desayunos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Inicio
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(event) => setFormData({ ...formData, start_time: event.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Fin
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(event) => setFormData({ ...formData, end_time: event.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
              Dias activos
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                    formData.active_days.includes(day.id)
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-slate-50 text-slate-400 border border-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
              formData.is_active
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              {formData.is_active ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
              <div className="text-left">
                <p className="font-black text-sm">Estado del menu</p>
                <p className="text-xs font-semibold opacity-75">
                  {formData.is_active ? 'Activo dentro del horario' : 'Oculto del POS'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
              {formData.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </button>

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-sm shadow-lg hover:bg-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {menu ? 'Actualizar menu' : 'Crear menu'}
          </button>
        </form>
      </div>
    </div>
  )
}
