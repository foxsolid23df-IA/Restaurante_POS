import { UserPlus, Users } from 'lucide-react'

export default function StaffHeader({ onAddStaff }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 w-full">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-xl shadow-emerald-100">
            <Users size={32} />
          </div>
          Gestión de Personal
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Controla el acceso al sistema, roles y permisos granulares.</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={onAddStaff}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200 group text-sm h-14"
        >
          <UserPlus size={18} className="group-hover:scale-110 transition-transform"/>
          Registrar Empleado
        </button>
      </div>
    </div>
  )
}
