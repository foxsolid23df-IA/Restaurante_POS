import { Calendar, Clock, Users, CheckCircle2, XCircle, MoreVertical, MapPin, Phone } from 'lucide-react'

export default function ReservationList({ reservations, onUpdateStatus, loading }) {
  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando Reservas...</p>
       </div>
    )
  }

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invitado / Cliente</th>
              <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agenda y Contacto</th>
              <th className="px-10 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quórum (Pax)</th>
              <th className="px-10 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado Actual</th>
              <th className="px-10 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reservations.map((res) => (
              <tr key={res.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner group-hover:shadow-lg group-hover:rotate-3">
                      {(res.customers?.name || 'I')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg tracking-tight uppercase">{res.customers?.name || 'Invitado sin Reg.'}</p>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Mesa Virtual #{res.id.slice(0, 4)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3 text-slate-900 font-black text-sm tracking-tight">
                         <Calendar size={16} className="text-primary" />
                         {new Date(res.reservation_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 font-black text-xs">
                         <Clock size={16} className="text-slate-300" />
                         {new Date(res.reservation_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </td>
                <td className="px-10 py-8 text-center">
                   <div className="inline-flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100/50">
                      <Users size={16} className="text-primary" />
                      <span className="font-black text-slate-900 text-lg">{res.pax}</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-center">
                   <StatusBadge status={res.status} />
                </td>
                <td className="px-10 py-8 text-center">
                   <div className="flex justify-center items-center gap-3">
                      {res.status === 'pending' && (
                        <button 
                          onClick={() => onUpdateStatus(res.id, 'confirmed')}
                          className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                          title="Confirmar"
                        >
                          <CheckCircle2 size={24} />
                        </button>
                      )}
                      {res.status !== 'cancelled' && (
                        <button 
                           onClick={() => onUpdateStatus(res.id, 'cancelled')}
                           className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                           title="Cancelar"
                        >
                          <XCircle size={24} />
                        </button>
                      )}
                      <button className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                         <MoreVertical size={20} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {reservations.length === 0 && (
         <div className="text-center py-32 px-10">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner opacity-40">
               <Calendar size={48} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Agenda Disponible</h3>
            <p className="text-slate-400 font-medium">No hay reservaciones registradas para los próximos ciclos.</p>
         </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const configs = {
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Confirmada', dot: 'bg-emerald-500' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Pendiente', dot: 'bg-amber-500' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100', label: 'Cancelada', dot: 'bg-rose-500' }
  }
  
  const config = configs[status] || configs.pending
  
  return (
    <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full border ${config.bg} ${config.text} ${config.border} shadow-sm transition-all animate-in fade-in zoom-in-95`}>
       <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
       <span className="text-[10px] font-black uppercase tracking-[0.2em]">{config.label}</span>
    </div>
  )
}
