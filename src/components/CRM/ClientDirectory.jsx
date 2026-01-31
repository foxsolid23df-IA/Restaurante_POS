import { Phone, Mail, Award, Edit3, Trash2, Heart, Star, ShieldCheck } from 'lucide-react'

export default function ClientDirectory({ customers, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-100 rounded-[3rem]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
      {customers.map((customer) => (
        <ClientCard 
          key={customer.id} 
          customer={customer} 
          onEdit={() => onEdit(customer)} 
          onDelete={() => onDelete(customer.id)} 
        />
      ))}
    </div>
  )
}

function ClientCard({ customer, onEdit, onDelete }) {
  const points = customer.loyalty_points || 0
  const isVIP = points > 500

  return (
    <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative group overflow-hidden">
      {/* Indicador VIP */}
      {isVIP && (
         <div className="absolute top-8 right-8 bg-amber-400 text-amber-900 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-amber-200 flex items-center gap-2 border border-white/20">
            <Star size={12} fill="currentColor" />
            Cliente VIP
         </div>
      )}
      
      <div className="flex items-center gap-6 mb-8">
        <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center font-black text-3xl shadow-inner transform group-hover:rotate-6 transition-all ${
          isVIP ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-slate-50 text-slate-300 border border-slate-100'
        }`}>
          {customer.name[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{customer.name}</h3>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-primary" />
            Socio #{customer.id.slice(0, 6).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
             <Heart size={10} className="text-rose-400" /> Puntos Elite
           </p>
           <p className="font-black text-slate-900 text-2xl tracking-tighter">
             {points} <span className="text-xs text-slate-400 font-bold uppercase ml-1">pts</span>
           </p>
        </div>
        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Frecuencia</p>
           <p className="font-black text-slate-900 text-lg uppercase tracking-tight">Alta</p>
        </div>
      </div>

      <div className="space-y-4 mb-8 px-2">
        <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-900 transition-colors">
          <div className="p-3 bg-slate-50 rounded-xl">
             <Phone size={16} className="text-primary" />
          </div>
          <span className="font-black text-sm tracking-tight">{customer.phone || 'Sin Teléfono'}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-900 transition-colors">
          <div className="p-3 bg-slate-50 rounded-xl">
             <Mail size={16} className="text-primary" />
          </div>
          <span className="font-black text-sm tracking-tight truncate">{customer.email || 'Sin Correo'}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onEdit}
          className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95"
        >
          <Edit3 size={16} />
          Gestionar
        </button>
        <button 
          onClick={onDelete}
          className="flex-1 py-5 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-100/50 active:scale-95"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
