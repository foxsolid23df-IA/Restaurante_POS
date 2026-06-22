import { Briefcase, Circle, Coffee, Edit3, Receipt, Shield, ShieldCheck, User } from 'lucide-react'

export default function StaffCard({ user, onEdit }) {
  const getRoleInfo = (role) => {
    const roles = {
      admin: { label: 'Administrador', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Shield size={14} /> },
      manager: { label: 'Gerente', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Briefcase size={14} /> },
      captain: { label: 'Capitan', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <ShieldCheck size={14} /> },
      waiter: { label: 'Mesero', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Coffee size={14} /> },
      cashier: { label: 'Cajero', color: 'bg-primary-50 text-primary-700 border-primary-100', icon: <Receipt size={14} /> }
    }
    return roles[role] || { label: role, color: 'bg-slate-50 text-slate-700 border-slate-100', icon: <User size={14} /> }
  }

  const roleInfo = getRoleInfo(user.role)
  const pinConfigured = Boolean(user.pinConfigured || user.pin_code_hash || user.pin_code)

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className="flex items-start justify-between mb-6">
        <div className="relative">
          <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
            {user.full_name?.charAt(0) || '?'}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg`}>
            {user.is_active ? <ShieldCheck size={12} className="text-white" /> : <Circle size={9} className="text-white fill-current" />}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${roleInfo.color}`}>
            {roleInfo.icon}
            {roleInfo.label}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-600' : 'text-rose-500'}`}>
            {user.is_active ? 'Acceso habilitado' : 'Acceso restringido'}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{user.full_name}</h3>
        <p className="text-slate-400 font-bold text-xs truncate mt-1">{user.email || `ID: ${user.id?.substring(0, 8)}...`}</p>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PIN POS</span>
        <span className={`text-[10px] font-black uppercase tracking-tight ${pinConfigured ? 'text-emerald-600' : 'text-rose-500'}`}>
          {pinConfigured ? 'Configurado' : 'Pendiente'}
        </span>
      </div>

      <button
        onClick={() => onEdit(user)}
        className="w-full bg-white text-slate-900 py-3 rounded-xl font-black flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all"
      >
        <Edit3 size={17} />
        Gestionar perfil
      </button>
    </div>
  )
}
