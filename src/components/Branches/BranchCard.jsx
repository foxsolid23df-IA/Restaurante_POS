import { MapPin, Phone, Check, Settings, ShieldCheck } from 'lucide-react'

export default function BranchCard({ branch, isCurrent, onSelect }) {
  return (
    <div 
      className={`bg-white rounded-[3.5rem] p-10 border transition-all relative overflow-hidden group duration-500 hover:shadow-2xl ${
        isCurrent 
          ? 'border-primary ring-8 ring-primary/5 bg-emerald-50/10' 
          : 'border-slate-100 hover:border-primary/20 hover:scale-[1.02]'
      }`}
    >
      {branch.is_main_office && (
         <div className="absolute top-10 right-10 bg-slate-900 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 border border-white/20">
            <ShieldCheck size={12} className="text-primary" />
            Sede Matriz
         </div>
      )}
      
      <div className="flex items-center gap-8 mb-10">
         <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all border font-black text-3xl shadow-inner transform group-hover:rotate-6 ${
           isCurrent 
             ? 'bg-primary text-white border-primary shadow-emerald-200' 
             : 'bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary border-slate-100'
         }`}>
            {branch.name.charAt(0).toUpperCase()}
         </div>
         <div className="flex-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">{branch.name}</h3>
            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em]">
               <MapPin size={14} className="text-primary" />
               <span className="truncate max-w-[200px]">{branch.address || 'Ubicación Geográfica pendiente'}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10">
         <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
               Línea Directa
            </p>
            <p className="font-black text-slate-900 flex items-center gap-3 text-lg tracking-tight truncate">
               <Phone size={16} className="text-slate-300" />
               {branch.phone || 'N/A'}
            </p>
         </div>
         <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado Operativo</p>
            <div className="flex items-center gap-3">
               <div className={`w-2.5 h-2.5 rounded-full ${branch.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
               <p className="font-black text-slate-900 uppercase text-xs tracking-widest">{branch.is_active ? 'En Línea' : 'Fuera de Servicio'}</p>
            </div>
         </div>
      </div>

      <div className="flex gap-4">
         <button 
          onClick={() => onSelect(branch)}
          className={`flex-1 py-6 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-95 ${
            isCurrent 
            ? 'bg-primary text-white shadow-emerald-200 cursor-default' 
            : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'
          }`}
         >
           {isCurrent ? (
             <><Check size={18} /> Sucursal Activa</>
           ) : (
             'Conectar'
           )}
         </button>
         <button className="p-6 bg-white text-slate-400 rounded-[1.8rem] hover:text-primary hover:bg-emerald-50 transition-all border-2 border-slate-50 hover:border-primary/20 transform active:rotate-12 shadow-sm">
            <Settings size={20} />
         </button>
      </div>
    </div>
  )
}
