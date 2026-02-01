import { useState, useEffect } from 'react'
import { X, Gift, Save, Trash2, Zap, Star, Award, TrendingUp, Sparkles, Loader2 } from 'lucide-react'

const ICONS = [
  { name: 'Gift', icon: Gift },
  { name: 'Zap', icon: Zap },
  { name: 'Star', icon: Star },
  { name: 'Award', icon: Award },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Sparkles', icon: Sparkles }
]

export default function RewardEditorModal({ reward, onClose, onSave, onDelete, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_cost: 100,
    icon_name: 'Gift'
  })

  useEffect(() => {
    if (reward) {
      setFormData({
        title: reward.title || '',
        description: reward.description || '',
        points_cost: reward.points_cost || 100,
        icon_name: reward.icon_name || 'Gift'
      })
    }
  }, [reward])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(reward?.id ? { ...formData, id: reward.id } : formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl border border-white/20 relative overflow-hidden">
        
        <div className="p-10 border-b border-slate-50 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {reward ? 'Editar Recompensa' : 'Nueva Recompensa'}
            </h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 border-l-4 border-primary pl-4">
              Configurador de Lealtad v1.0
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Título del Beneficio</label>
            <input 
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ej. Postre Gratis"
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Descripción (Subtítulo)</label>
            <input 
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ej. Aplica en postres de la casa"
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Costo en Puntos</label>
              <div className="relative">
                 <input 
                   required
                   type="number"
                   min="1"
                   value={formData.points_cost}
                   onChange={(e) => setFormData({...formData, points_cost: parseInt(e.target.value)})}
                   className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 font-black text-2xl text-slate-900 outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-inner h-20"
                 />
                 <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-primary text-xs uppercase tracking-widest">PTS</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Icono Visual</label>
              <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100 h-20 items-center justify-between px-4">
                {ICONS.map((item) => {
                  const Icon = item.icon
                  const isSelected = formData.icon_name === item.name
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setFormData({...formData, icon_name: item.name})}
                      className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-primary text-white shadow-lg' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      <Icon size={20} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            {reward && (
              <button 
                type="button"
                onClick={() => onDelete(reward.id)}
                className="p-6 bg-rose-50 text-rose-500 rounded-[2rem] hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>
                  <Save size={20} />
                  {reward ? 'Guardar Cambios' : 'Añadir Recompensa'}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
