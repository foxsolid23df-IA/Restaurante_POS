import { Award, TrendingUp, Star, Crown, Zap, Gift, ChevronRight, Sparkles } from 'lucide-react'

export default function LoyaltySystem({ customers }) {
  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0)
  const topCustomer = customers.sort((a,b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))[0]

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
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100 mb-2">Próxima Recompensar</h3>
           <p className="text-4xl font-black tracking-tighter mb-4">Cena Maridaje</p>
           <div className="bg-black/20 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest">Nivel Requerido</span>
              <span className="font-black text-xs bg-white text-emerald-600 px-4 py-1.5 rounded-xl shadow-lg">5000 pts</span>
           </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        <div className="bg-white rounded-[4rem] p-14 border border-slate-100 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-14 opacity-5 pointer-events-none">
              <Gift size={150} />
           </div>
           <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tight flex items-center gap-4 uppercase">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <Gift size={24} />
              </div>
              Reglas de Canje
           </h3>
           <div className="space-y-6">
              <RewardItem icon={<Zap size={18}/>} title="Bebida de Cortesía" desc="Cualquier bebida sin alcohol del menú" cost="150" />
              <RewardItem icon={<Award size={18}/>} title="Postre Estrella" desc="Selección gourmet del chef" cost="350" />
              <RewardItem icon={<TrendingUp size={18}/>} title="15% de Descuento" desc="Aplicable en consumo total (sin bebidas alcohólicas)" cost="750" color="primary" />
              <RewardItem icon={<Star size={18}/>} title="Experiencia VIP" desc="Cena privada de 3 tiempos para dos personas" cost="2500" color="primary" />
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
           <button className="bg-slate-900 text-white px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 inline-flex items-center gap-4 mx-auto">
              Auditar Transacciones
              <ChevronRight size={18} />
           </button>
        </div>
      </div>
    </div>
  )
}

function RewardItem({ icon, title, desc, cost, color = "slate" }) {
  return (
    <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all duration-500 group">
       <div className={`p-4 rounded-2xl border shadow-sm transition-all group-hover:rotate-6 ${
         color === 'primary' ? 'bg-primary text-white border-primary shadow-emerald-100' : 'bg-white text-slate-400 border-slate-100'
       }`}>
          {icon}
       </div>
       <div className="flex-1">
          <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1 text-lg">{title}</h4>
          <p className="text-xs text-slate-400 font-medium">{desc}</p>
       </div>
       <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-sm font-black text-slate-900">{cost}</span>
          <span className="text-[10px] font-black text-primary uppercase ml-1">pts</span>
       </div>
    </div>
  )
}

function ShieldCheck(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  )
}
