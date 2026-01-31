import { Edit3, Circle, ShieldCheck, User, Shield, Briefcase, Coffee, Receipt } from 'lucide-react'

export default function StaffCard({ user, onEdit }) {
  const getRoleInfo = (role) => {
    const roles = {
      admin: { label: 'Administrador', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Shield size={14}/> },
      manager: { label: 'Gerente', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Briefcase size={14}/> },
      captain: { label: 'Capitán', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <ShieldCheck size={14}/> },
      waiter: { label: 'Mesero', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Coffee size={14}/> },
      cashier: { label: 'Cajero', color: 'bg-primary-50 text-primary-700 border-primary-100', icon: <Receipt size={14}/> },
    }
    return roles[role] || { label: role, color: 'bg-slate-50 text-slate-700 border-slate-100', icon: <User size={14}/> }
  }

  const roleInfo = getRoleInfo(user.role)

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-[1.02] transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-all text-slate-900 pointer-events-none">
          <User size={120} />
      </div>

      <div className="flex items-start justify-between mb-8">
        <div className="relative">
           <div className="bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-slate-200 group-hover:rotate-3 transition-transform">
             {user.full_name?.charAt(0) || '?'}
           </div>
           <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg`}>
              {user.is_active ? <ShieldCheck size={14} className="text-white"/> : <Circle size={10} className="text-white fill-current"/>}
           </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${roleInfo.color}`}>
              {roleInfo.icon}
              {roleInfo.label}
           </span>
           <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-600' : 'text-rose-500'}`}>
              {user.is_active ? 'Acceso Habilitado' : 'Acceso Restringido'}
           </span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">{user.full_name}</h3>
        <p className="text-slate-400 font-bold text-sm truncate uppercase tracking-tight mt-1 opacity-70">ID: {user.id?.substring(0, 8)}...</p>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 mb-8">
         <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className={`w-2.5 h-2.5 rounded-full ${user.pin_code ? 'bg-slate-900' : 'bg-slate-200 border border-slate-300'}`}></div>
               ))}
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PIN de Acceso</span>
         </div>
         <span className={`text-[10px] font-black uppercase tracking-tight ${user.pin_code ? 'text-emerald-600' : 'text-rose-500'}`}>
            {user.pin_code ? 'Configurado' : 'Pendiente'}
         </span>
      </div>

      <button
        onClick={() => onEdit(user)}
        className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm hover:shadow-xl"
      >
        <Edit3 size={18} />
        Gestionar Perfil
      </button>
    </div>
  )
}
