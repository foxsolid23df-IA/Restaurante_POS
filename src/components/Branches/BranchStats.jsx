import { Building2, Users, Shield, MapPin } from 'lucide-react'

export default function BranchStats({ branches }) {
  const mainCount = branches.filter(b => b.is_main_office).length
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <StatCard 
        icon={<Building2 size={24}/>} 
        label="Sucursales Activas" 
        value={branches.length} 
        color="text-primary"
        bg="bg-emerald-50"
      />
      <StatCard 
        icon={<Users size={24}/>} 
        label="Staff Total" 
        value="Activo" 
        color="text-blue-600"
        bg="bg-blue-50"
      />
      <StatCard 
        icon={<Shield size={24}/>} 
        label="Sedes Matriz" 
        value={mainCount} 
        color="text-indigo-600"
        bg="bg-indigo-50"
      />
      <StatCard 
        icon={<MapPin size={24}/>} 
        label="Ubicaciones" 
        value={branches.length} 
        color="text-amber-600"
        bg="bg-amber-50"
      />
    </div>
  )
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:scale-[1.05] transition-all duration-500">
       <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-all scale-[2.5] transform group-hover:rotate-12 ${color}`}>
          {icon}
       </div>
       <div className="flex items-center gap-5 mb-6 relative z-10">
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white shadow-inner transition-all ${bg} ${color}`}>
           {icon}
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       </div>
       <h4 className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">{value}</h4>
    </div>
  )
}
