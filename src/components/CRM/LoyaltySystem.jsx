import { useState, useMemo } from 'react'
import { 
  Award, TrendingUp, Star, Crown, Zap, Gift, 
  ChevronRight, Sparkles, Plus, Edit3, Trash2, 
  Settings2, ShieldCheck, Loader2 
} from 'lucide-react'
import { useLoyaltyRewards } from '@/hooks/useLoyaltyRewards'
import { useBusinessStore } from '@/hooks/useBusinessSettings'
import RewardEditorModal from './RewardEditorModal'
import LoyaltyAuditModal from './LoyaltyAuditModal'

export default function LoyaltySystem({ customers }) {
  const { rewards, loading, saveReward, deleteReward } = useLoyaltyRewards()
  const { settings, updateSettings } = useBusinessStore()
  const [editingReward, setEditingReward] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const totalPoints = useMemo(() => 
    customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0), 
  [customers])

  const topCustomer = useMemo(() => 
    [...customers].sort((a,b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))[0],
  [customers])

  const handleSaveReward = async (data) => {
    setIsActionLoading(true)
    try {
      await saveReward(data)
      setShowEditor(false)
      setEditingReward(null)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteReward = async (id) => {
    if (!confirm('¿Deseas eliminar este beneficio del programa?')) return
    setIsActionLoading(true)
    try {
      await deleteReward(id)
      setShowEditor(false)
      setEditingReward(null)
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group border-4 border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-all duration-700" />
          <div className="relative z-10">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 border border-primary/20">
               <Zap className="text-primary" size={32} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Capital de Puntos</h3>
            <p className="text-6xl font-black tracking-tighter mb-4">{totalPoints}</p>
            <p className="text-sm font-medium text-slate-400 leading-relaxed font-sans">Puntos totales circulando en el ecosistema del restaurante.</p>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
           <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-10 scale-150 transition-all">
              <Crown size={150} className="text-amber-500" />
           </div>
           <div className="flex justify-between items-start mb-10">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
                 <Star size={32} fill="currentColor" />
              </div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest border border-amber-200 shadow-sm">Cliente del Mes</span>
           </div>
           <div>
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Líder del Ranking</h3>
              <p className="text-4xl font-black text-slate-900 leading-none tracking-tighter mb-2">{topCustomer?.name || '---'}</p>
              <p className="text-primary font-black text-lg">{topCustomer?.loyalty_points || 0} PTS ACUMULADOS</p>
           </div>
        </div>

        <div className="bg-emerald-600 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-emerald-200/50 relative overflow-hidden group border-4 border-emerald-500">
           <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-[60px]" />
           <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 border border-white/20">
              <Sparkles className="text-white" size={32} />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100 mb-2">Máximo Beneficio</h3>
           <p className="text-4xl font-black tracking-tighter mb-4">
             {rewards.length > 0 ? rewards[rewards.length - 1].title : 'Configurar'}
           </p>
           <div className="bg-black/20 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest">Requerido</span>
              <span className="font-black text-xs bg-white text-emerald-600 px-4 py-1.5 rounded-xl shadow-lg">
                {rewards.length > 0 ? rewards[rewards.length - 1].points_cost : '---'} pts
              </span>
           </div>
        </div>
      </div>

      {/* Rewards & Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        <div className="bg-white rounded-[4rem] p-14 border border-slate-100 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-14 opacity-5 pointer-events-none">
              <Gift size={150} />
           </div>
           
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                   <Settings2 size={24} />
                 </div>
                 Reglas de Canje
              </h3>
              <button 
                onClick={() => { setEditingReward(null); setShowEditor(true); }}
                className="p-4 bg-primary text-white rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                <Plus size={24} />
              </button>
           </div>

           <div className="space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Loader2 className="animate-spin text-primary mb-4" size={32} />
                  <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando reglas...</p>
                </div>
              ) : rewards.length > 0 ? (
                rewards.map((reward) => (
                  <RewardItem 
                    key={reward.id}
                    reward={reward}
                    onEdit={() => { setEditingReward(reward); setShowEditor(true); }}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Gift size={64} className="text-slate-300 mb-4" />
                  <p className="font-black text-xs uppercase tracking-widest text-center">No hay productos de canje<br/>configurados aún.</p>
                </div>
              )}
           </div>
        </div>

        {/* Accumulation Rules & Security */}
        <div className="space-y-12">
          {/* New: Accumulation Rules Panel */}
          <div className="bg-white rounded-[4rem] p-14 border border-slate-100 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-14 opacity-5 pointer-events-none rotate-12">
                <TrendingUp size={150} />
             </div>
             
             <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tight flex items-center gap-4 uppercase">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <TrendingUp size={24} />
                </div>
                Reglas de Acumulación
             </h3>

             <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                   <div className="text-center md:text-left">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Por cada gasto de</p>
                      <div className="flex items-center gap-3">
                         <span className="text-3xl font-black text-slate-900">$</span>
                         <input 
                           type="number" 
                           value={settings?.currency_unit_amount || 10}
                           onChange={(e) => updateSettings({ ...settings, currency_unit_amount: parseFloat(e.target.value) })}
                           className="w-32 bg-white border border-slate-200 rounded-2xl px-5 py-3 font-black text-2xl text-slate-900 outline-none focus:border-primary transition-all shadow-sm"
                         />
                      </div>
                   </div>

                   <div className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-lg text-primary rotate-90 md:rotate-0">
                      <ChevronRight size={24} />
                   </div>

                   <div className="text-center md:text-left">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">El cliente gana</p>
                      <div className="flex items-center gap-3">
                         <input 
                           type="number" 
                           value={settings?.points_per_currency || 1}
                           onChange={(e) => updateSettings({ ...settings, points_per_currency: parseInt(e.target.value) })}
                           className="w-24 bg-white border border-slate-200 rounded-2xl px-5 py-3 font-black text-2xl text-slate-900 outline-none focus:border-primary transition-all shadow-sm text-center"
                         />
                         <span className="text-xs font-black text-primary uppercase tracking-widest">Punto</span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-relaxed flex-1">
                     Tip: Un ratio de $10 = 1 pt es el estándar en restaurantes VIP.
                   </p>
                   <div className="flex items-center gap-4 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100">
                      <ShieldCheck size={16} className="text-rose-500" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Alerta de Fraude (+ de)</span>
                         <input 
                           type="number" 
                           value={settings?.daily_points_limit || 1000}
                           onChange={(e) => updateSettings({ ...settings, daily_points_limit: parseInt(e.target.value) })}
                           className="bg-transparent font-black text-rose-600 outline-none w-16 text-xs"
                         />
                      </div>
                      <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">PTS / DIA</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-50/50 rounded-[4rem] p-14 border border-slate-100 shadow-inner flex flex-col justify-center text-center">
             <div className="bg-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-slate-50 rotate-3 group-hover:rotate-0 transition-all duration-500">
                <ShieldCheck className="text-primary" size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-none">Seguridad del Programa</h3>
             <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-sm mx-auto mb-10">
               Los puntos de lealtad están cifrados y vinculados al folio de venta real para evitar duplicidades.
             </p>
             <button 
                onClick={() => setShowAudit(true)}
                className="bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 inline-flex items-center gap-4 mx-auto"
             >
                Auditar Transacciones
                <ChevronRight size={18} />
             </button>
          </div>
        </div>
      </div>

      {showEditor && (
        <RewardEditorModal 
          reward={editingReward}
          onClose={() => { setShowEditor(false); setEditingReward(null); }}
          onSave={handleSaveReward}
          onDelete={handleDeleteReward}
          loading={isActionLoading}
        />
      )}

      {showAudit && (
        <LoyaltyAuditModal 
          onClose={() => setShowAudit(false)}
        />
      )}
    </div>
  )
}

function RewardItem({ reward, onEdit }) {
  const IconMap = {
    'Gift': Gift,
    'Zap': Zap,
    'Star': Star,
    'Award': Award,
    'TrendingUp': TrendingUp,
    'Sparkles': Sparkles
  }
  
  const Icon = IconMap[reward.icon_name] || Gift

  return (
    <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all duration-500 group relative">
       <button 
         onClick={onEdit}
         className="absolute top-6 right-6 p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100 transition-all shadow-sm"
       >
         <Edit3 size={14} />
       </button>

       <div className={`p-4 rounded-2xl border shadow-sm transition-all group-hover:rotate-6 bg-white text-primary border-slate-100`}>
          <Icon size={18} />
       </div>
       <div className="flex-1">
          <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1 text-lg">{reward.title}</h4>
          <p className="text-xs text-slate-400 font-medium">{reward.description}</p>
       </div>
       <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-sm font-black text-slate-900">{reward.points_cost}</span>
          <span className="text-[10px] font-black text-primary uppercase ml-1">pts</span>
       </div>
    </div>
  )
}

