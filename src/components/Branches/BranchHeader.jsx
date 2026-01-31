import { Plus } from 'lucide-react'

export default function BranchHeader({ onAddBranch }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión de Sucursales</h1>
        <p className="text-slate-500 font-medium mt-2">Control centralizado y transferencia de inventario multi-sucursal</p>
      </div>
      <button 
        onClick={onAddBranch}
        className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-black transition-all shadow-2xl shadow-slate-200 flex items-center gap-3 text-sm uppercase tracking-widest active:scale-95"
      >
        <Plus size={20} />
        Nueva Sucursal
      </button>
    </div>
  )
}
