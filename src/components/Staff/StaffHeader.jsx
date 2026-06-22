import { UserPlus, Users } from 'lucide-react'

export default function StaffHeader({ onAddStaff }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 w-full">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <Users size={28} />
          </div>
          Gestion de Personal
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Controla acceso, roles y permisos granulares.</p>
      </div>

      <button
        onClick={onAddStaff}
        className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black flex items-center gap-3 hover:bg-black transition-all shadow-lg shadow-slate-200 text-sm"
      >
        <UserPlus size={18} />
        Registrar empleado
      </button>
    </div>
  )
}
